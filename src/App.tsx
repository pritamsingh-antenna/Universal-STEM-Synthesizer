/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  History,
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen, 
  BrainCircuit, 
  ChevronDown, 
  Cpu, 
  Layers, 
  Loader2, 
  RefreshCw, 
  Settings2, 
  Sparkles,
  Binary,
  Atom,
  Calculator,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Image as ImageIcon,
  Trophy,
  GraduationCap,
  School,
  Zap,
  Upload,
  X,
  Plus,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  generateAdvancedProblem, 
  solveProblem,
  regenerateFigure,
  reviewProblem,
  reworkProblem,
  generateTechnicalDiagram,
  type GeneratedProblem, 
  type ProblemRequest, 
  type SolvedProblem,
  type ReviewResult,
  type ReworkResult,
  type DiagramRequest,
  type DiagramResult
} from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getFriendlyErrorMessage(err: any, defaultMsg: string): string {
  const msg = err?.message || String(err) || '';
  if (msg === 'API_KEY_REQUIRED' || msg.includes('API_KEY_REQUIRED')) {
    return 'Image generation is currently restricted. Please check your API Key permissions.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return 'Quota Exceeded: You have exceeded your Gemini API quota. Please check your plan and billing details in Google AI Studio settings.';
  }
  return defaultMsg;
}

const DOMAINS = {
  'Physics': [
    'Quantum Mechanics', 'Thermodynamics', 'Astrophysics', 'Particle Physics', 
    'Condensed Matter', 'Electromagnetism', 'General Relativity', 'Fluid Dynamics', 
    'Plasma Physics', 'Optics & Photonics', 'Nuclear Physics', 'Statistical Mechanics', 
    'Acoustics', 'Geophysics', 'Engineering Physics (Electrical and Electronics Applications)'
  ],
  'Chemistry': [
    'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry', 
    'Biochemistry', 'Theoretical Chemistry', 'Quantum Chemistry', 'Polymer Chemistry', 
    'Environmental Chemistry', 'Materials Chemistry', 'Medicinal Chemistry', 
    'Thermochemistry', 'Electrochemistry', 'Chemical Kinetics'
  ],
  'Mathematics': [
    'Topology', 'Differential Geometry', 'Number Theory', 'Abstract Algebra', 
    'Complex Analysis', 'Stochastic Processes', 'Graph Theory', 'Functional Analysis', 
    'Category Theory', 'Partial Differential Equations', 'Combinatorics', 
    'Real Analysis', 'Linear Algebra', 'Set Theory', 'Engineering Mathematics', 
    'Numerical Methods', 'Probability and Statistics', 'Optimization Techniques'
  ],
  'Electrical Engineering': [
    'Circuit Theory', 'Network Analysis', 'Electrical Machines', 'Power Generation', 
    'High Voltage Engineering', 'Electrical Measurements', 'Electric Drives', 
    'Renewable Energy Integration', 'Smart Grid Technology', 'HVDC Transmission',
    'Industrial Instrumentation', 'Power Quality', 'Advanced Control Systems',
    'Electric Vehicles'
  ],
  'Electronics and Communication Engineering': [
    'Digital Electronics', 'Analog Circuits', 'Communication Systems', 'RF Engineering',
    'Digital Signal Processing', 'Wireless Communication', 'Optical Communication', 
    'Satellite Communication', 'Microelectronics', 'Nanoelectronics',
    'Information Theory and Coding', 'Antenna Theory and Design', 'Radar Engineering'
  ],
  'Computer Science Engineering': [
    'Algorithms & Data Structures', 'Complexity Theory', 'Operating Systems', 
    'Database Systems', 'Computer Networks', 'Software Engineering', 
    'Distributed Systems', 'Computer Architecture', 'Theory of Computation', 
    'Compiler Design', 'Parallel Computing', 'Computer Vision'
  ],
  'Mechanical Engineering': [
    'Solid Mechanics', 'Machine Design', 'Manufacturing Processes', 'Dynamics and Vibrations', 
    'Internal Combustion Engines', 'CAD/CAM/CAE', 'Automotive Engineering',
    'Kinematics of Machinery', 'Industrial Hydraulics', 'Mechatronics Systems'
  ],
  'Civil Engineering': [
    'Structural Analysis', 'Geotechnical Engineering', 'Transportation Engineering', 
    'Hydraulics & Water Resources', 'Surveying', 'Construction Management', 
    'Steel Structures', 'Concrete Technology', 'Earthquake Engineering',
    'Prestressed Concrete', 'Foundation Engineering'
  ],
  'Chemical Engineering': [
    'Chemical Reaction Engineering', 'Separation Processes', 'Plant Design', 
    'Mass Transfer', 'Heat Transfer Operations', 'Fluid Mechanics for Chemical Engineers', 
    'Chemical Engineering Thermodynamics', 'Biochemical Engineering', 'Polymer Engineering'
  ],
  'Aerospace Engineering': [
    'Aerodynamics', 'Propulsion Systems', 'Flight Mechanics', 'Avionics', 
    'Orbital Mechanics', 'Rocket Engineering', 'Computational Fluid Dynamics (CFD)', 
    'Satellite Technology', 'Aircraft Structure & Design'
  ],
  'Biomedical Engineering': [
    'Biomechanics', 'Medical Imaging Systems', 'Biomaterials', 'Bioinstrumentation', 
    'Tissue Engineering', 'Neural Engineering', 'Medical Robotics', 'Clinical Engineering',
    'Bio-signals Processing'
  ],
  'Materials Engineering': [
    'Metallurgy', 'Polymer Science', 'Ceramics Engineering', 'Composite Materials', 
    'Nanomaterials', 'Material Characterization (XRD, SEM)', 'Phase Transformations', 
    'Crystallography', 'Corrosion Engineering'
  ],
  'Industrial Engineering': [
    'Operations Research', 'Supply Chain Management', 'Quality Engineering', 
    'Production Planning & Control', 'Facility Layout', 'Ergonomics', 
    'Lean Manufacturing', 'Six Sigma', 'Logistics Management'
  ],
  'Power Systems': [
    'Stability Analysis', 'Load Flow Studies', 'Protection Systems', 'Economic Dispatch', 
    'Power Grid Resilience', 'Transient Analysis', 'Distributed Generation',
    'Substation Automation', 'Wide Area Monitoring (WAMS)'
  ],
  'Power Electronics': [
    'Converter Topologies', 'Inverters', 'DC-DC Converters', 'AC-DC Converters', 
    'PWM Control Techniques', 'Motor Drives', 'Resonant Converters', 'Power Semiconductor Devices',
    'Soft Switching Techniques'
  ],
  'Control Systems': [
    'Linear Control Theory', 'Nonlinear Control', 'State-Space Analysis', 'Optimal Control', 
    'Adaptive Control', 'Robust Control', 'Digital Control Systems', 'Predictive Control',
    'Stochastic Control'
  ],
  'Signal Processing': [
    'Statistical Signal Processing', 'Adaptive Signal Processing', 'Image Processing', 
    'Speech & Audio Processing', 'Compressive Sensing', 'Wavelet Analysis', 
    'Array Signal Processing', 'Biomedical Signal Processing'
  ],
  'VLSI Design': [
    'CMOS Analog Design', 'Physical Design & Layout', 'Digital Logic Design (Verilog/VHDL)', 
    'Low Power VLSI', 'Testing & Verification', 'ASIC Design', 'FPGA Prototyping',
    'Mixed-Signal VLSI'
  ],
  'Embedded Systems': [
    'RTOS (Real-Time Operating Systems)', 'Microcontroller Interfacing', 'Device Drivers', 
    'Embedded C Programming', 'Hardware-Software Co-design', 'Embedded Linux Systems',
    'ARM Cortex Architectures', 'Low Power Embedded Systems'
  ],
  'RF Engineering': [
    'Microwave Circuits', 'RF System Design', 'High Frequency Measurements', 
    'Mixers and Oscillators', 'RF Filters & Passive Components', 'Transmission Lines',
    'Electromagnetic Compatibility (EMC)'
  ],
  'Antenna Design': [
    'Microstrip Patch Antennas', 'Dipole & Monopole Arrays', 'Phased Array Synthesis', 
    'MIMO Antenna Systems', 'Reflector Antennas', 'Smart Antennas',
    'Dielectric Resonator Antennas'
  ],
  'Artificial Intelligence': [
    'Knowledge Representation', 'Search Algorithms', 'Natural Language Processing (NLP)', 
    'Expert Systems', 'AI for Games', 'Recommender Systems', 'Automated Reasoning', 
    'Robotic Process Automation'
  ],
  'Machine Learning': [
    'Supervised Learning (Regression/Classification)', 'Unsupervised Learning (Clustering)', 
    'Deep Learning (CNN/RNN)', 'Neural Networks', 'Reinforcement Learning', 
    'Generative Adversarial Networks (GANs)', 'Transfer Learning', 'Feature Engineering'
  ],
  'Data Science': [
    'Statistical Inference', 'Exploratory Data Analysis', 'Big Data Analytics', 
    'Data Visualization', 'Predictive Modeling', 'Data Mining', 'ETL Pipelines', 
    'Time Series Analysis'
  ],
  'Cyber Security': [
    'Network Security Protocol', 'Cryptography', 'Ethical Hacking', 'Intrusion Detection Systems', 
    'Malware Analysis', 'Digital Forensics', 'Identity & Access Management', 
    'Cloud Security', 'Blockchain Security'
  ],
  'Cloud Computing': [
    'Cloud Infrastructure (IaaS/PaaS/SaaS)', 'Virtualization Technologies', 
    'Microservices Architecture', 'Serverless Computing', 'Cloud Native Development', 
    'DevOps & CI/CD', 'Docker & Kubernetes Containers'
  ],
  'Robotics': [
    'Robot Kinematics & Dynamics', 'Path Planning Algorithms', 'Robot Sensors', 
    'Human-Robot Interaction', 'Swarm Robotics', 'Mobile Robotics', 
    'Industrial Manipulators', 'Computer Vision for Robotics'
  ],
  'Mechatronics': [
    'Sensors & Actuators', 'Programmable Logic Controllers (PLC)', 'HMI Design', 
    'Industrial Automation', 'Hydraulic & Pneumatic Systems', 'Electro-mechanical Integration', 
    'Precision Engineering'
  ],
  'Thermodynamics': [
    'Statistical Thermodynamics', 'Chemical Thermodynamics', 'Internal Combustion Engines', 
    'Refrigeration & Air Conditioning', 'Power Plant Cycles', 'Entropy & Exergy Analysis',
    'Cryogenics'
  ],
  'Fluid Mechanics': [
    'Incompressible & Compressible Flow', 'Turbulence Modeling', 'Boundary Layer Theory', 
    'Hydrodynamics', 'Aerodynamics of Wings', 'Multiphase Flow', 'Bio-fluid Mechanics'
  ],
  'Structural Engineering': [
    'Matrix Structural Analysis', 'Finite Element Method (FEM)', 'Steel & Concrete Structures', 
    'Seismic Analysis', 'Bridge Engineering', 'High-Rise Construction', 'Structural Dynamics'
  ],
  'Geotechnical Engineering': [
    'Soil Mechanics', 'Rock Mechanics', 'Foundation Design', 'Slope Stability', 
    'Ground Improvement Techniques', 'Tunneling Engineering', 'Soil Dynamics'
  ],
  'Environmental Engineering': [
    'Water & Wastewater Treatment', 'Air Quality Management', 'Solid Waste Technology', 
    'Hydrology & Hydraulics', 'Sustainability Engineering', 'Environmental Policy & Impact'
  ],
  'Process Engineering': [
    'Process Simulation & Modeling', 'Unit Operations', 'Process Optimization', 
    'Chemical Plant Safety', 'Reaction Kinetics', 'Energy Integration'
  ],
  'Nanotechnology': [
    'Nano-electronics', 'Nano-materials Synthesis', 'Nano-photonics', 
    'Nano-biotechnology', 'Characterization at the Nano-scale', 'Carbon Nanotubes'
  ],
  'Quantum Engineering': [
    'Quantum Computation', 'Quantum Information Science', 'Quantum Sensing', 
    'Quantum Optics', 'Superconducting Logic', 'Quantum Hardware Control'
  ],
  'IoT': [
    'Wireless Sensor Networks', 'IoT Protocol Stacks (MQTT/CoAP)', 'Edge Computing', 
    'Smart Cities & IoT', 'Industrial IoT (IIoT)', 'M2M Communication'
  ],
  'Cyber-Physical Systems': [
    'Hybrid System Control', 'Formal Verification', 'Embedded Control Systems', 
    'Real-time Networks', 'Fault Tolerant Computing', 'Modeling & Simulation of CPS'
  ],
  'Nuclear Engineering': [
    'Nuclear Reactor Physics', 'Nuclear Fusion Research', 'Radiation Shielding & Protection', 
    'Nuclear Fuel Cycle Management', 'Reactor Safety Analysis'
  ],
  'Petroleum Engineering': [
    'Reservoir Simulation', 'Drilling Technology', 'Petrophysical Analysis', 
    'Enhanced Oil Recovery (EOR)', 'Production Optimization'
  ],
  'Mining Engineering': [
    'Rock Mechanics & Blasting', 'Surface & Underground Mining', 'Mineral Processing', 
    'Mine Ventilation & Safety', 'Mine Planning & Reclamation'
  ],
  'Marine Engineering': [
    'Ship Hydrodynamics', 'Marine Propulsion Systems', 'Offshore Structural Design', 
    'Naval Architecture', 'Underwater Robotics'
  ],
  'Agricultural Engineering': [
    'Precision Farming Machinery', 'Irrigation & Drainage Systems', 'Crop Processing Technology', 
    'Bio-systems Modeling', 'Soil Health & Conservation Engineering'
  ],
  'Textile Engineering': [
    'Fiber Science & Morphology', 'Smart Textiles', 'Garment Manufacturing Processes', 
    'Textile Chemistry & Dyeing', 'High-Performance Technical Textiles'
  ],
  'Food Engineering': [
    'Food Preservation Technologies', 'Rheology of Food Materials', 'Unit Operations in Food processing', 
    'Packaging Engineering', 'Nutraceutical Production'
  ],
  'Automotive Engineering': [
    'Vehicle Dynamics & Control', 'Electric & Hybrid Powertrains', 'Autonomous Driving Systems', 
    'Crashtest Simulation', 'Automotive Embedded Software', 'Electric Vehicles'
  ],
  'Railway Engineering': [
    'Railway Track & Infrastructure', 'Signaling & Train Control Systems', 'Rolling Stock Engineering', 
    'Railway Electrification', 'High-Speed Rail Logistics'
  ],
  'Photonics': [
    'Laser Engineering', 'Opto-electronics', 'Fiber Optic Sensors', 
    'Nanophotonics', 'Integrated Optical Circuits', 'Biophotonics'
  ],
  'Electromagnetics': [
    'Computational Electromagnetics', 'Wave Propagation & Scattering', 'Metamaterials', 
    'Microwave Antennas', 'Electromagnetic Interference (EMI)'
  ],
  'MEMS': [
    'Micro-sensors & Actuators', 'Bio-MEMS', 'Radio Frequency MEMS (RF-MEMS)', 
    'Optical MEMS (MOEMS)', 'Micromachining Technologies'
  ],
  'Spintronics': [
    'Magnetic Tunnel Junctions', 'Spin Transfer Torque (STT)', 'Magnetic Storage Media', 
    'Spin Hall Effect Devices', 'Spintronic Logic Circuits'
  ],
  'Other Engineering Fields': [
    'Systems Engineering', 'Industrial Management', 'Energy Economics', 
    'Professional Ethics in Engineering'
  ]
};

const COMPLEXITIES = ['School Level', 'Graduate Level', 'Masters Level', 'Postdoc Level', 'PhD Level'];

const GENERATOR_MESSAGES = [
  'Initializing PhD-Level Technical Audit...',
  'Synthesizing Advanced STEM Problem...',
  'Performing First-Principles Derivation...',
  'Rendering High-Fidelity Technical Figure...',
  'Verifying Dimensional Consistency...',
  'Finalizing Peer-Review Quality Output...'
];

const SOLVER_MESSAGES = [
  'Analyzing Multi-Modal Problem Context...',
  'Extracting Implicit Boundary Conditions...',
  'Executing Step-by-Step Formal Derivation...',
  'Performing Rigorous Limit Verification...',
  'Formatting Publication-Ready LaTeX...'
];

const REVIEWER_MESSAGES = [
  'Executing Senior Peer Review Protocol...',
  'Auditing Technical Accuracy & Rigor...',
  'Evaluating PhD-Level Complexity Alignment...',
  'Formulating Critical Review Feedback...',
  'Finalizing Editorial Decision...'
];

const REWORKER_MESSAGES = [
  'Analyzing Critical Reviewer Feedback...',
  'Synthesizing Corrected Formal Solution...',
  'Auditing Technical Integrity & Flow...',
  'Verifying First-Principles Alignment...',
  'Finalizing Publication-Ready Rework...'
];


const MarkdownRenderer = React.memo(({ content, className }: { content: string; className?: string }) => {
  return (
    <div className={cn("prose prose-slate max-w-none", className)}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
        className || "hover:bg-slate-200 text-slate-500 hover:text-indigo-600"
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function DownloadButton({ imageUrl, filename }: { imageUrl: string; filename: string }) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 text-slate-500 hover:text-indigo-600"
      title="Download Figure"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Download PNG</span>
    </button>
  );
}

function ExportTextButton({ problem, domain, subDomain, complexity }: { 
  problem: GeneratedProblem; 
  domain: string; 
  subDomain: string; 
  complexity: string;
}) {
  const handleExport = () => {
    const content = `STEM GenAI - Problem Export
=========================================
Domain: ${domain}
Subject: ${subDomain}
Complexity: ${complexity}
Date: ${new Date().toLocaleString()}

PROBLEM STATEMENT
-----------------
${problem.question}

${problem.figureDescription ? `FIGURE DESCRIPTION / TikZ\n-------------------------\n${problem.figureDescription}\n` : ''}

STEP-BY-STEP SOLUTION
---------------------
${problem.solution}

FINAL ANSWER
------------
${problem.finalAnswer}

=========================================
Generated by STEM GenAI
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `problem-${subDomain.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 text-slate-500 hover:text-indigo-600"
      title="Export as Text"
    >
      <FileText className="w-3.5 h-3.5" />
      <span>Export .txt</span>
    </button>
  );
}

function DownloadReviewButton({ reviewResult, question, solution, figureDesc }: { reviewResult: ReviewResult, question: string, solution: string, figureDesc: string }) {
  const handleExport = () => {
    const content = `STEM GenAI - Review Report
=========================================
Status: ${reviewResult.status.toUpperCase()}
Score: ${reviewResult.score}/100
Date: ${new Date().toLocaleString()}

IDENTIFIED CONTEXT
------------------
Domain: ${reviewResult.identifiedDomain || 'N/A'}
Subject: ${reviewResult.identifiedSubject || 'N/A'}

ORIGINAL PROBLEM STATEMENT
--------------------------
${question}

${figureDesc ? `ORIGINAL FIGURE DESCRIPTION\n---------------------------\n${figureDesc}\n` : ''}

ORIGINAL SOLUTION
-----------------
${solution}

TECHNICAL ACCURACY
------------------
${reviewResult.technicalAccuracy}

PEDAGOGICAL VALUE
-----------------
${reviewResult.pedagogicalValue}
${reviewResult.futureActions ? `\nFUTURE ACTIONS\n--------------\n${reviewResult.futureActions}\n` : ''}
${reviewResult.correctedQuestion ? `\nCORRECTED PROBLEM STATEMENT\n---------------------------\n${reviewResult.correctedQuestion}\n` : ''}
${reviewResult.correctedFigureDescription ? `\nCORRECTED FIGURE DESCRIPTION\n----------------------------\n${reviewResult.correctedFigureDescription}\n` : ''}
${reviewResult.correctedSolution ? `\nCORRECTED SOLUTION\n------------------\n${reviewResult.correctedSolution}\n` : ''}
${reviewResult.correctedFinalAnswer ? `\nCORRECTED FINAL ANSWER\n----------------------\n${reviewResult.correctedFinalAnswer}\n` : ''}
=========================================
Generated by STEM GenAI Peer Review
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `review-${(reviewResult.identifiedSubject || 'problem').toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-indigo-100"
      title="Download Review Text Format"
    >
      <Download className="w-4 h-4" />
      <span>Download txt format</span>
    </button>
  );
}

export default function App() {
  const [mode, setMode] = useState<'generator' | 'solver' | 'reviewer' | 'rework' | 'diagram'>('generator');
  
  // Generator State
  const [domain, setDomain] = useState<keyof typeof DOMAINS>('Physics');
  const [subDomain, setSubDomain] = useState('');
  const [showSubjectOptions, setShowSubjectOptions] = useState(false);
  const [manualTopic, setManualTopic] = useState('');
  const [activeConfigTab, setActiveConfigTab] = useState<'options' | 'domain' | 'subject'>('options');
  const [complexity, setComplexity] = useState(COMPLEXITIES[4]);
  const [figureDependent, setFigureDependent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [history, setHistory] = useState<GeneratedProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [isRegeneratingFigure, setIsRegeneratingFigure] = useState(false);
  const [isFigureModalOpen, setIsFigureModalOpen] = useState(false);

  // Solver State
  const [solveQuestion, setSolveQuestion] = useState('');
  const [solveImage, setSolveImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [solving, setSolving] = useState(false);
  const [solvingMessageIndex, setSolvingMessageIndex] = useState(0);
  const [solvedResult, setSolvedResult] = useState<SolvedProblem | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);

  // Reviewer State
  const [reviewQuestion, setReviewQuestion] = useState('');
  const [reviewSolution, setReviewSolution] = useState('');
  const [reviewFigureDesc, setReviewFigureDesc] = useState('');
  const [reviewImage, setReviewImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [reviewHasFigure, setReviewHasFigure] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewingMessageIndex, setReviewingMessageIndex] = useState(0);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Rework State
  const [reworkQuestion, setReworkQuestion] = useState('');
  const [reworkSolution, setReworkSolution] = useState('');
  const [reworkComment, setReworkComment] = useState('');
  const [reworkImage, setReworkImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [reworking, setReworking] = useState(false);
  const [reworkingMessageIndex, setReworkingMessageIndex] = useState(0);
  const [reworkResult, setReworkResult] = useState<ReworkResult | null>(null);
  const [reworkError, setReworkError] = useState<string | null>(null);

  // Diagram State
  const [diagramTopic, setDiagramTopic] = useState('');
  const [diagramProblemBox, setDiagramProblemBox] = useState('');
  const [diagramFigureDescription, setDiagramFigureDescription] = useState('');
  const [diagramComponents, setDiagramComponents] = useState('');
  const [diagramParameters, setDiagramParameters] = useState('');
  const [generatingDiagram, setGeneratingDiagram] = useState(false);
  const [diagramResult, setDiagramResult] = useState<DiagramResult | null>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);

  const problem = currentIndex >= 0 ? history[currentIndex] : null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSolveImage({
        data: base64String,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setReviewImage({
        data: base64String,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleReworkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setReworkImage({
        data: base64String,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!solveQuestion.trim() && !solveImage) {
      setSolveError('Please provide a question or an image.');
      return;
    }

    setSolving(true);
    setSolvingMessageIndex(0);
    setSolveError(null);
    setSolvedResult(null);

    const interval = setInterval(() => {
      setSolvingMessageIndex(prev => (prev + 1) % SOLVER_MESSAGES.length);
    }, 2500);

    try {
      const result = await solveProblem({
        question: solveQuestion,
        image: solveImage || undefined
      });
      setSolvedResult(result);
    } catch (err: any) {
      console.error(err);
      setSolveError(getFriendlyErrorMessage(err, 'Failed to solve problem. Please try again.'));
    } finally {
      clearInterval(interval);
      setSolving(false);
    }
  };

  const handleReview = async () => {
    if (!reviewQuestion.trim() || !reviewSolution.trim()) {
      setReviewError('Please provide both the question and the solution.');
      return;
    }

    setReviewing(true);
    setReviewingMessageIndex(0);
    setReviewError(null);
    setReviewResult(null);

    const interval = setInterval(() => {
      setReviewingMessageIndex(prev => (prev + 1) % REVIEWER_MESSAGES.length);
    }, 2500);

    try {
      const result = await reviewProblem({
        question: reviewQuestion,
        solution: reviewSolution,
        complexity,
        hasFigure: reviewHasFigure,
        figureDescription: reviewHasFigure ? reviewFigureDesc : undefined,
        image: reviewImage || undefined
      });
      setReviewResult(result);
    } catch (err: any) {
      console.error(err);
      setReviewError(getFriendlyErrorMessage(err, 'Failed to review problem. Please try again.'));
    } finally {
      clearInterval(interval);
      setReviewing(false);
    }
  };

  const handleRework = async () => {
    if (!reworkQuestion.trim() || !reworkSolution.trim() || !reworkComment.trim()) {
      setReworkError('Please provide the question, solution, and reviewer comments.');
      return;
    }

    setReworking(true);
    setReworkingMessageIndex(0);
    setReworkError(null);
    setReworkResult(null);

    const interval = setInterval(() => {
      setReworkingMessageIndex(prev => (prev + 1) % REWORKER_MESSAGES.length);
    }, 2500);

    try {
      const result = await reworkProblem({
        question: reworkQuestion,
        solution: reworkSolution,
        reviewerComment: reworkComment,
        image: reworkImage || undefined
      });
      setReworkResult(result);
    } catch (err: any) {
      console.error(err);
      setReworkError(getFriendlyErrorMessage(err, 'Failed to rework problem. Please try again.'));
    } finally {
      clearInterval(interval);
      setReworking(false);
    }
  };

  const handleGenerateDiagram = async () => {
    if (!diagramTopic.trim()) {
      setDiagramError('Please provide a topic for the diagram.');
      return;
    }

    setGeneratingDiagram(true);
    setDiagramError(null);
    setDiagramResult(null);

    try {
      const result = await generateTechnicalDiagram({
        topic: diagramTopic,
        problemBox: diagramProblemBox,
        figureDescription: diagramFigureDescription,
        components: diagramComponents,
        parameters: diagramParameters
      });
      setDiagramResult(result);
    } catch (err: any) {
      console.error(err);
      setDiagramError(getFriendlyErrorMessage(err, 'Failed to generate diagram. Please try again.'));
    } finally {
      setGeneratingDiagram(false);
    }
  };


  const handleRegenerateFigure = async () => {
    if (!problem || !problem.imagePrompt) return;
    
    setIsRegeneratingFigure(true);
    try {
      const newImageUrl = await regenerateFigure(problem.imagePrompt);
      if (newImageUrl) {
        const updatedHistory = [...history];
        updatedHistory[currentIndex] = { ...problem, imageUrl: newImageUrl };
        setHistory(updatedHistory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegeneratingFigure(false);
    }
  };

  const handleGenerate = async () => {
    if (!subDomain.trim()) {
      setError('Please select or enter a subject first.');
      return;
    }

    setLoading(true);
    setLoadingMessageIndex(0);
    setError(null);

    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % GENERATOR_MESSAGES.length);
    }, 3000);

    try {
      const result = await generateAdvancedProblem({
        domain,
        subDomain: subDomain.trim(),
        topic: manualTopic.trim() || undefined,
        complexity,
        figureDependent
      });
      setHistory(prev => [...prev, result]);
      setCurrentIndex(history.length);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, 'Failed to generate problem. Please try again.'));
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-xl tracking-tight text-slate-800 leading-none">STEM Gen<span className="text-indigo-600">AI</span></h1>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">by Dr. Pritam Singh</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              <Zap className="w-3.5 h-3.5 fill-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-widest">High-Rigor Mode Active</span>
            </div>
            <span className="hidden sm:inline">PhD-Level Technical Auditor</span>
          </div>
        </div>
      </header>

      {/* Figure Modal */}
      <AnimatePresence>
        {isFigureModalOpen && problem?.imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 sm:p-8"
            onClick={() => setIsFigureModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <DownloadButton 
                  imageUrl={problem.imageUrl} 
                  filename={`figure-${subDomain.toLowerCase().replace(/\s+/g, '-')}.png`} 
                />
                <button
                  onClick={() => setIsFigureModalOpen(false)}
                  className="p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 sm:p-8 flex items-center justify-center bg-white min-h-[60vh]">
                <img 
                  src={problem.imageUrl} 
                  alt="Full Screen Figure" 
                  className="max-w-full max-h-[80vh] object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Technical Diagram: {subDomain}</h4>
                  <p className="text-xs text-slate-500">High-Fidelity Synthesis • 1024x1024</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRegenerateFigure}
                    disabled={isRegeneratingFigure}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRegeneratingFigure && "animate-spin")} />
                    {isRegeneratingFigure ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Mode Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
            <button
              onClick={() => setMode('generator')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                mode === 'generator' 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Problem Generator
            </button>
            <button
              onClick={() => setMode('solver')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                mode === 'solver' 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <Calculator className="w-4 h-4" />
              Problem Solver
            </button>
            <button
              onClick={() => setMode('reviewer')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                mode === 'reviewer' 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              Problem Reviewer
            </button>
            <button
              onClick={() => setMode('rework')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                mode === 'rework' 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Problem Rework
            </button>
            <button
              onClick={() => setMode('diagram')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                mode === 'diagram' 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <Layout className="w-4 h-4" />
              Diagram Generator
            </button>
          </div>
        </div>

        {mode === 'generator' ? (
          <>
            {/* Controls Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Configuration</h2>
                </div>
                <div className="flex bg-slate-200/50 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveConfigTab('options')}
                    className={cn(
                      "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                      activeConfigTab === 'options' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Options
                  </button>
                  <button 
                    onClick={() => setActiveConfigTab('domain')}
                    className={cn(
                      "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                      activeConfigTab === 'domain' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Domain
                  </button>
                  <button 
                    onClick={() => setActiveConfigTab('subject')}
                    className={cn(
                      "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                      activeConfigTab === 'subject' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Subject
                  </button>
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeConfigTab === 'domain' && (
                    <motion.div
                      key="domain-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-bold text-slate-800">Select Academic Domain</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.keys(DOMAINS).map((d) => (
                          <button
                            key={d}
                            onClick={() => {
                              const newDomain = d as keyof typeof DOMAINS;
                              setDomain(newDomain);
                              setSubDomain('');
                              setActiveConfigTab('subject');
                            }}
                            className={cn(
                              "flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                              domain === d 
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200" 
                                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-slate-50"
                            )}
                          >
                            {d}
                            {domain === d && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeConfigTab === 'subject' && (
                    <motion.div
                      key="subject-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-bold text-slate-800">Select Subject for {domain}</span>
                        </div>
                        <button 
                          onClick={() => setActiveConfigTab('domain')}
                          className="text-[10px] font-bold text-indigo-600 hover:underline uppercase"
                        >
                          Change Domain
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject / Area of Specialization</label>
                        <div className="relative" id="subject-combo-container">
                          <input 
                            type="text"
                            value={subDomain}
                            onFocus={() => setShowSubjectOptions(true)}
                            onChange={(e) => {
                              setSubDomain(e.target.value);
                              setShowSubjectOptions(true);
                            }}
                            placeholder={`Search ${domain} subjects or type custom...`}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowSubjectOptions(!showSubjectOptions)}
                            className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showSubjectOptions && "rotate-180")} />
                          </button>

                          <AnimatePresence>
                            {showSubjectOptions && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setShowSubjectOptions(false)}
                                />
                                <motion.div 
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-[300px] flex flex-col"
                                >
                                  <div className="overflow-y-auto py-1">
                                    {DOMAINS[domain]
                                      .filter(s => s.toLowerCase().includes(subDomain.toLowerCase()))
                                      .map((s, i) => (
                                        <button
                                          key={`sub-${i}`}
                                          onClick={() => {
                                            setSubDomain(s);
                                            setShowSubjectOptions(false);
                                          }}
                                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between group"
                                        >
                                          <span className={cn("font-medium", subDomain === s ? "text-indigo-600" : "text-slate-700")}>
                                            {s}
                                          </span>
                                          {subDomain === s && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                        </button>
                                      ))}
                                    {DOMAINS[domain].filter(s => s.toLowerCase().includes(subDomain.toLowerCase())).length === 0 && (
                                      <div className="px-4 py-8 text-center text-slate-400">
                                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs">No matching subjects found.</p>
                                        <p className="text-xs mt-1">Press enter to use "{subDomain}" as custom area.</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="bg-slate-50 border-t border-slate-100 p-2 text-[10px] text-slate-400 flex items-center gap-1.5 justify-center">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Scroll for more unique sub-domains</span>
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          Clicking the input or arrow shows specialized {domain} subjects.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Specific Research Topic (Optional)
                        </label>
                        <input 
                          type="text"
                          value={manualTopic}
                          onChange={(e) => setManualTopic(e.target.value)}
                          placeholder="e.g. Regenerative Braking Efficiency in Li-ion Systems"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal"
                        />
                        <p className="text-[10px] text-slate-400 italic">
                          Providing a specific topic directs the AI to prioritize that exact area of research.
                        </p>
                      </div>

                      <p className="text-[10px] text-slate-400 italic">
                        The problem generator will synthesize a PhD-level challenge specifically for {subDomain.trim()}.
                      </p>
                    </motion.div>
                  )}

                  {activeConfigTab === 'options' && (
                    <motion.div
                      key="options-tab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      {/* Complexity */}
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" /> Academic Complexity
                        </label>
                        <div className="relative">
                          <select 
                            value={complexity}
                            onChange={(e) => setComplexity(e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700 font-medium"
                          >
                            {COMPLEXITIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Figure Toggle */}
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" /> Figure Dependency
                        </label>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                          <button
                            onClick={() => setFigureDependent(true)}
                            className={cn(
                              "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all",
                              figureDependent ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                          >
                            With Figure
                          </button>
                          <button
                            onClick={() => setFigureDependent(false)}
                            className={cn(
                              "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all",
                              !figureDependent ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                          >
                            No Figure
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="group relative inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  )}
                  {loading ? GENERATOR_MESSAGES[loadingMessageIndex] : 'Synthesize Problem'}
                </button>
              </div>
            </div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-8"
            >
              <div className="bg-red-100 p-1.5 rounded-full">
                <Settings2 className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {history.length > 1 && (
            <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <History className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Generation History</h4>
                  <p className="text-[10px] text-slate-500">Problem {currentIndex + 1} of {history.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Previous Problem"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(history.length - 1, prev + 1))}
                  disabled={currentIndex === history.length - 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Next Problem"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {problem && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Question Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Problem Statement</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <ExportTextButton 
                      problem={problem} 
                      domain={domain} 
                      subDomain={subDomain} 
                      complexity={complexity} 
                    />
                    <CopyButton text={problem.question} />
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded uppercase">
                      {complexity}
                    </span>
                  </div>
                </div>
                <div className="p-8 prose prose-slate max-w-none">
                  <div className="text-lg leading-relaxed text-slate-700">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {problem.question}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>

              {/* Figure Section */}
              {figureDependent && (
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Figure 1</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      {problem.imageUrl && (
                        <>
                          <button
                            onClick={handleRegenerateFigure}
                            disabled={isRegeneratingFigure}
                            className="p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 text-slate-500 hover:text-indigo-600 disabled:opacity-50"
                            title="Regenerate Figure"
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", isRegeneratingFigure && "animate-spin")} />
                            <span>{isRegeneratingFigure ? 'Regenerating...' : 'Regenerate'}</span>
                          </button>
                          <DownloadButton 
                            imageUrl={problem.imageUrl} 
                            filename={`figure-${subDomain.toLowerCase().replace(/\s+/g, '-')}.png`} 
                          />
                        </>
                      )}
                      <CopyButton text={problem.figureDescription} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                    {problem.imageUrl && (
                      <div className="flex-1 p-8 flex items-center justify-center bg-white min-h-[400px] relative">
                        <AnimatePresence mode="wait">
                          {isRegeneratingFigure ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm"
                            >
                              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                              <p className="text-sm font-bold text-slate-600 animate-pulse">Synthesizing Technical Diagram...</p>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                        
                        <motion.div 
                          key={problem.imageUrl}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group w-full max-w-2xl cursor-zoom-in"
                          onClick={() => setIsFigureModalOpen(true)}
                        >
                          <img 
                            src={problem.imageUrl} 
                            alt="Generated Figure" 
                            className="w-full h-auto rounded-xl shadow-2xl border border-slate-100 transition-transform duration-500 group-hover:scale-[1.02]"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                          
                          {/* Zoom Hint */}
                          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-slate-200 text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <Plus className="w-3 h-3" />
                            Click to Enlarge
                          </div>
                        </motion.div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "p-8 bg-slate-900 font-mono text-sm text-indigo-300 overflow-x-auto",
                      problem.imageUrl ? "lg:w-1/3" : "w-full"
                    )}>
                      <div className="flex items-center gap-2 mb-4">
                        <Binary className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Technical Description / TikZ</span>
                      </div>
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                        {problem.figureDescription}
                      </pre>
                    </div>
                  </div>
                </section>
              )}

              {/* Solution Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Formal Technical Solution</h3>
                  </div>
                  <CopyButton text={problem.solution} />
                </div>
                <div className="p-8 bg-indigo-50/30">
                  <MarkdownRenderer content={problem.solution} />
                </div>
              </section>

              {/* Final Answer */}
              <section className="bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 overflow-hidden text-white">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <h3 className="font-bold uppercase tracking-wider text-xs">Final Answer</h3>
                  </div>
                  <div className="text-white">
                    <CopyButton 
                      text={problem.finalAnswer} 
                      className="hover:bg-white/10 text-white/70 hover:text-white"
                    />
                  </div>
                </div>
                <div className="p-8 text-center">
                  <div className="inline-block bg-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/20">
                    <MarkdownRenderer content={`$${problem.finalAnswer}$`} />
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {!problem && !loading && !error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-full mb-6">
                <Atom className="w-10 h-10 text-indigo-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Ready to Synthesize</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Select your domain and complexity level above to generate a unique, PhD-level STEM problem with a complete derivation.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    ) : mode === 'solver' ? (
      <div className="space-y-8">
            {/* Solver Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-800">Problem Solver</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Problem Statement
                  </label>
                  <textarea
                    value={solveQuestion}
                    onChange={(e) => setSolveQuestion(e.target.value)}
                    placeholder="Enter the STEM problem here... (LaTeX supported)"
                    className="w-full min-h-[150px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-700 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Figure / Image (Optional)
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {!solveImage ? (
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-500">Upload</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    ) : (
                      <div className="relative w-32 h-32">
                        <img 
                          src={`data:${solveImage.mimeType};base64,${solveImage.data}`} 
                          alt="Uploaded" 
                          className="w-full h-full object-cover rounded-xl border border-slate-200"
                        />
                        <button 
                          onClick={() => setSolveImage(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleSolve}
                    disabled={solving || (!solveQuestion.trim() && !solveImage)}
                    className="group relative inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {solving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    {solving ? SOLVER_MESSAGES[solvingMessageIndex] : 'Solve Problem'}
                  </button>
                </div>
              </div>
            </div>

            {/* Solver Results */}
            <AnimatePresence mode="wait">
              {solveError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3"
                >
                  <div className="bg-red-100 p-1.5 rounded-full">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium">{solveError}</p>
                </motion.div>
              )}

              {solvedResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Solution Section */}
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Formal Technical Solution</h3>
                      </div>
                      <CopyButton text={solvedResult.solution} />
                    </div>
                    <div className="p-8 bg-indigo-50/30">
                      <MarkdownRenderer content={solvedResult.solution} />
                    </div>
                  </section>

                  {/* Final Answer */}
                  <section className="bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 overflow-hidden text-white">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-wider text-xs">Final Answer</h3>
                      </div>
                      <div className="text-white">
                        <CopyButton 
                          text={solvedResult.finalAnswer} 
                          className="hover:bg-white/10 text-white/70 hover:text-white"
                        />
                      </div>
                    </div>
                    <div className="p-8 text-center">
                      <div className="inline-block bg-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/20">
                        <MarkdownRenderer content={`$${solvedResult.finalAnswer}$`} />
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : mode === 'rework' ? (
          <div className="space-y-8">
            {/* Rework Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-800">Problem Rework</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Problem Statement
                  </label>
                  <textarea
                    value={reworkQuestion}
                    onChange={(e) => setReworkQuestion(e.target.value)}
                    placeholder="Paste the problem statement here..."
                    className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" /> Original Solution
                  </label>
                  <textarea
                    value={reworkSolution}
                    onChange={(e) => setReworkSolution(e.target.value)}
                    placeholder="Paste the original solution here..."
                    className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <History className="w-4 h-4" /> Reviewer Comments
                  </label>
                  <textarea
                    value={reworkComment}
                    onChange={(e) => setReworkComment(e.target.value)}
                    placeholder="Paste the reviewer's feedback and correction requirements here..."
                    className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Figure / Image (Optional)
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {!reworkImage ? (
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-500">Upload</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleReworkImageUpload} />
                      </label>
                    ) : (
                      <div className="relative w-32 h-32">
                        <img 
                          src={`data:${reworkImage.mimeType};base64,${reworkImage.data}`} 
                          alt="Uploaded Rework Figure" 
                          className="w-full h-full object-cover rounded-xl border border-slate-200"
                        />
                        <button 
                          onClick={() => setReworkImage(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleRework}
                    disabled={reworking || !reworkQuestion.trim() || !reworkSolution.trim() || !reworkComment.trim()}
                    className="group relative inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {reworking ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    {reworking ? REWORKER_MESSAGES[reworkingMessageIndex] : 'Rework Solution'}
                  </button>
                </div>
              </div>
            </div>

            {/* Rework Results */}
            <AnimatePresence mode="wait">
              {reworkError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3"
                >
                  <Settings2 className="w-4 h-4" />
                  <p className="text-sm font-medium">{reworkError}</p>
                </motion.div>
              )}

              {reworkResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Explanation Section */}
                  <section className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      <h3 className="font-bold text-amber-800 uppercase tracking-wider text-xs">Rework Summary</h3>
                    </div>
                    <p className="text-slate-700 font-medium">{reworkResult.explanation}</p>
                  </section>

                  {/* Reworked Solution Section */}
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Reworked Technical Solution</h3>
                      </div>
                      <CopyButton text={reworkResult.reworkedSolution} />
                    </div>
                    <div className="p-8 bg-indigo-50/30">
                      <MarkdownRenderer content={reworkResult.reworkedSolution} />
                    </div>
                  </section>

                  {/* Final Answer */}
                  <section className="bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 overflow-hidden text-white">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-wider text-xs">Reworked Final Answer</h3>
                      </div>
                      <div className="text-white">
                        <CopyButton 
                          text={reworkResult.finalAnswer} 
                          className="hover:bg-white/10 text-white/70 hover:text-white"
                        />
                      </div>
                    </div>
                    <div className="p-8 text-center">
                      <div className="inline-block bg-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/20">
                        <MarkdownRenderer content={`$${reworkResult.finalAnswer}$`} />
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : mode === 'diagram' ? (
          <div className="space-y-8">
            {/* Diagram Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Layout className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-800">Technical Diagram Generator</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Topic / System
                  </label>
                  <input
                    type="text"
                    value={diagramTopic}
                    onChange={(e) => setDiagramTopic(e.target.value)}
                    placeholder="e.g., Buck Converter, Cantilever Beam, Quantum Well..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Problem Box (Context)
                    </label>
                    <textarea
                      value={diagramProblemBox}
                      onChange={(e) => setDiagramProblemBox(e.target.value)}
                      placeholder="Paste associated problem or context here..."
                      className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" /> Figure Description
                    </label>
                    <textarea
                      value={diagramFigureDescription}
                      onChange={(e) => setDiagramFigureDescription(e.target.value)}
                      placeholder="Describe exactly how the figure should look..."
                      className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Components to Include
                    </label>
                    <textarea
                      value={diagramComponents}
                      onChange={(e) => setDiagramComponents(e.target.value)}
                      placeholder="e.g., MOSFET, Inductor, Diode, Capacitor..."
                      className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <Settings2 className="w-4 h-4" /> Specific Parameters
                    </label>
                    <textarea
                      value={diagramParameters}
                      onChange={(e) => setDiagramParameters(e.target.value)}
                      placeholder="e.g., Vin=10V, L=50uH, f=100kHz..."
                      className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleGenerateDiagram}
                    disabled={generatingDiagram || !diagramTopic.trim()}
                    className="group relative inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {generatingDiagram ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    {generatingDiagram ? 'Synthesizing Diagram...' : 'Generate Diagram'}
                  </button>
                </div>
              </div>
            </div>

            {/* Diagram Results */}
            <AnimatePresence mode="wait">
              {diagramError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3"
                >
                  <Settings2 className="w-4 h-4" />
                  <p className="text-sm font-medium">{diagramError}</p>
                </motion.div>
              )}

              {diagramResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Technical Schematic</h3>
                      </div>
                      <DownloadButton 
                        imageUrl={diagramResult.imageUrl} 
                        filename={`diagram-${diagramTopic.toLowerCase().replace(/\s+/g, '-')}.png`} 
                      />
                    </div>
                    
                    <div className="p-8 flex flex-col items-center justify-center bg-white min-h-[400px]">
                      <img 
                        src={diagramResult.imageUrl} 
                        alt="Generated Technical Diagram" 
                        className="max-w-full h-auto rounded-xl shadow-2xl border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="bg-slate-900 p-8 text-indigo-300 font-mono text-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Technical Summary</span>
                      </div>
                      <p className="leading-relaxed">{diagramResult.description}</p>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Reviewer Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-800">Problem Reviewer</h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Complexity Level
                    </label>
                    <select 
                      value={complexity}
                      onChange={(e) => setComplexity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                    >
                      {COMPLEXITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Problem Statement
                  </label>
                  <textarea
                    value={reviewQuestion}
                    onChange={(e) => setReviewQuestion(e.target.value)}
                    placeholder="Paste the problem statement here..."
                    className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" /> Proposed Solution
                  </label>
                  <textarea
                    value={reviewSolution}
                    onChange={(e) => setReviewSolution(e.target.value)}
                    placeholder="Paste the step-by-step solution here..."
                    className="w-full min-h-[150px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="hasFigure" 
                      checked={reviewHasFigure}
                      onChange={(e) => setReviewHasFigure(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="hasFigure" className="text-sm font-medium text-slate-600 cursor-pointer">Include Figure Description for Review</label>
                  </div>
                  
                  {reviewHasFigure && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" /> Figure Description / TikZ
                        </label>
                        <textarea
                          value={reviewFigureDesc}
                          onChange={(e) => setReviewFigureDesc(e.target.value)}
                          placeholder="Describe the figure or paste TikZ code..."
                          className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                          <Upload className="w-4 h-4" /> Upload Figure (Optional)
                        </label>
                        <div className="flex flex-wrap gap-4">
                          {!reviewImage ? (
                            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mb-2" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-500">Upload</p>
                              </div>
                              <input type="file" className="hidden" accept="image/*" onChange={handleReviewImageUpload} />
                            </label>
                          ) : (
                            <div className="relative w-32 h-32">
                              <img 
                                src={`data:${reviewImage.mimeType};base64,${reviewImage.data}`} 
                                alt="Uploaded Review Figure" 
                                className="w-full h-full object-cover rounded-xl border border-slate-200"
                              />
                              <button 
                                onClick={() => setReviewImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleReview}
                    disabled={reviewing || !reviewQuestion.trim() || !reviewSolution.trim()}
                    className="group relative inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {reviewing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <BrainCircuit className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    {reviewing ? REVIEWER_MESSAGES[reviewingMessageIndex] : 'Submit for Peer Review'}
                  </button>
                </div>
              </div>
            </div>

            {/* Review Results */}
            <AnimatePresence mode="wait">
              {reviewError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3"
                >
                  <Settings2 className="w-4 h-4" />
                  <p className="text-sm font-medium">{reviewError}</p>
                </motion.div>
              )}

              {reviewResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <DownloadReviewButton 
                      reviewResult={reviewResult} 
                      question={reviewQuestion} 
                      solution={reviewSolution} 
                      figureDesc={reviewFigureDesc} 
                    />
                    <button
                      onClick={() => {
                        setReviewQuestion('');
                        setReviewSolution('');
                        setReviewFigureDesc('');
                        setReviewImage(null);
                        setReviewHasFigure(false);
                        setReviewResult(null);
                        setReviewError(null);
                      }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-200"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Review Next Problem</span>
                    </button>
                  </div>
                  <div className={cn(
                    "rounded-2xl border p-6 flex flex-col md:flex-row items-center gap-6",
                    reviewResult.status === 'accepted' ? "bg-emerald-50 border-emerald-200" :
                    reviewResult.status === 'rejected' ? "bg-rose-50 border-rose-200" :
                    "bg-amber-50 border-amber-200"
                  )}>
                    <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center text-white shrink-0",
                      reviewResult.status === 'accepted' ? "bg-emerald-500" :
                      reviewResult.status === 'rejected' ? "bg-rose-500" :
                      "bg-amber-500"
                    )}>
                      {reviewResult.status === 'accepted' ? <CheckCircle2 className="w-10 h-10" /> :
                       reviewResult.status === 'rejected' ? <X className="w-10 h-10" /> :
                       <History className="w-10 h-10" />}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <h3 className={cn(
                          "text-xl font-bold uppercase tracking-tight",
                          reviewResult.status === 'accepted' ? "text-emerald-700" :
                          reviewResult.status === 'rejected' ? "text-rose-700" :
                          "text-amber-700"
                        )}>
                          {reviewResult.status === 'accepted' ? 'Accepted' :
                           reviewResult.status === 'rejected' ? 'Rejected' :
                           'Feedback Provided'}
                        </h3>
                        <span className="bg-white/50 px-3 py-1 rounded-full text-sm font-bold border border-white/20">
                          Score: {reviewResult.score}/100
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">{reviewResult.comment}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Identified Context</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">{reviewResult.identifiedDomain}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm text-slate-600">{reviewResult.identifiedSubject}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Accuracy</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{reviewResult.technicalAccuracy}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pedagogical Value</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{reviewResult.pedagogicalValue}</p>
                  </div>

                  {/* Corrected Content Sections */}
                  {(reviewResult.correctedQuestion || reviewResult.correctedSolution || reviewResult.correctedImageUrl || reviewResult.correctedFinalAnswer) && (
                    <div className="space-y-8 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">Corrected & Aligned Content</h3>
                        <div className="h-px flex-1 bg-slate-200"></div>
                      </div>

                      {reviewResult.correctedQuestion && (
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-indigo-600" />
                              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Corrected Problem Statement</h3>
                            </div>
                            <CopyButton text={reviewResult.correctedQuestion} />
                          </div>
                          <div className="p-8 prose prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {reviewResult.correctedQuestion}
                            </ReactMarkdown>
                          </div>
                        </section>
                      )}

                      {reviewResult.correctedImageUrl && (
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-indigo-600" />
                              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Corrected Technical Figure</h3>
                            </div>
                            <DownloadButton 
                              imageUrl={reviewResult.correctedImageUrl} 
                              filename="corrected-figure.png" 
                            />
                          </div>
                          <div className="p-8 flex items-center justify-center bg-white">
                            <img 
                              src={reviewResult.correctedImageUrl} 
                              alt="Corrected Figure" 
                              className="max-w-full h-auto rounded-xl shadow-lg border border-slate-100"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          {reviewResult.correctedFigureDescription && (
                            <div className="bg-slate-900 p-6 text-indigo-300 font-mono text-xs">
                              <p className="leading-relaxed whitespace-pre-wrap">{reviewResult.correctedFigureDescription}</p>
                            </div>
                          )}
                        </section>
                      )}

                      {reviewResult.correctedSolution && (
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calculator className="w-5 h-5 text-indigo-600" />
                              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Corrected Step-by-Step Solution</h3>
                            </div>
                            <CopyButton text={reviewResult.correctedSolution} />
                          </div>
                          <div className="p-8 prose prose-slate max-w-none bg-indigo-50/30">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {reviewResult.correctedSolution}
                            </ReactMarkdown>
                          </div>
                        </section>
                      )}

                      {reviewResult.correctedFinalAnswer && (
                        <section className="bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 overflow-hidden text-white">
                          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5" />
                              <h3 className="font-bold uppercase tracking-wider text-xs">Corrected Final Answer</h3>
                            </div>
                            <div className="text-white">
                              <CopyButton 
                                text={reviewResult.correctedFinalAnswer} 
                                className="hover:bg-white/10 text-white/70 hover:text-white"
                              />
                            </div>
                          </div>
                          <div className="p-8 text-center">
                            <div className="inline-block bg-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/20">
                              <MarkdownRenderer content={`$${reviewResult.correctedFinalAnswer}$`} />
                            </div>
                          </div>
                        </section>
                      )}
                    </div>
                  )}

                  {reviewResult.futureActions && (
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Future Actions / Recommendations</h4>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{reviewResult.futureActions}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-400">
          Powered by Gemini 3 Flash • LaTeX Rendering via KaTeX
        </p>
      </footer>
    </div>
  );
}

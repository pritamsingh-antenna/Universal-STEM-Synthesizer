import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
}

export interface ProblemRequest {
  domain: string;
  subDomain: string;
  complexity: string;
  figureDependent: boolean;
  topic?: string;
}

export interface GeneratedProblem {
  question: string;
  figureDescription: string;
  imagePrompt?: string;
  imageUrl?: string;
  solution: string;
  finalAnswer: string;
}

export interface SolveRequest {
  question: string;
  image?: {
    data: string;
    mimeType: string;
  };
}

export interface SolvedProblem {
  solution: string;
  finalAnswer: string;
}

export interface LaTeXProblem {
  question: string;
  tikz: string;
}

export async function parseLaTeXProblem(text: string): Promise<LaTeXProblem> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Extract the STEM problem statement and any TikZ figure code from the following LaTeX document. 
    Return the result in JSON format.
    
    LaTeX Document:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          tikz: { type: Type.STRING },
        },
        required: ["question", "tikz"],
      },
    },
  });

  const text_res = response.text;
  if (!text_res) throw new Error("No response from AI");
  return JSON.parse(text_res);
}

export interface DiagramRequest {
  topic: string;
  problemBox?: string;
  figureDescription?: string;
  components: string;
  parameters: string;
}

export interface DiagramResult {
  imageUrl: string;
  description: string;
}

export async function generateTechnicalDiagram(req: DiagramRequest): Promise<DiagramResult> {
  const ai = getAI();
  const prompt = `
    Generate a highly detailed, professional technical engineering diagram for the following topic: ${req.topic}.
    
    ${req.problemBox ? `CONTEXT / PROBLEM STATEMENT:\n${req.problemBox}\n` : ''}
    ${req.figureDescription ? `SPECIFIC FIGURE DESCRIPTION:\n${req.figureDescription}\n` : ''}

    COMPONENTS TO INCLUDE:
    ${req.components}
    
    SPECIFIC PARAMETERS & VALUES:
    ${req.parameters}
    
    CRITICAL CONSTRAINTS:
    1. The diagram must be schematic-focused, professional, and indistinguishable from a TikZ-rendered PDF using Computer Modern font.
    2. All labels MUST use LaTeX formatting (e.g., $V_{in}$, $I_{out}$, $\\Omega$).
    3. Place the component values in a neat, rectangular information box on the right side of the diagram with the header 'System Parameters:'.
    4. If complex formulas are required, place them in callout boxes with arrows pointing to the system.
    5. Use a clean, high-contrast style (pure black ink on pure white background).
    6. Ensure all connections are logically sound for the given engineering topic.
    
    OUTPUT FORMAT (JSON):
    {
      "visualPrompt": "A highly descriptive, visual-only prompt for an AI image generator. Describe the spatial layout (favoring horizontal flow for systems), specific components (using standard IEEE symbols for circuits), and exact LaTeX labels required. Specify the use of Computer Modern serif font for all text. Focus on technical precision.",
      "description": "A technical summary of what the diagram represents, including the components and parameters."
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualPrompt: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["visualPrompt", "description"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  const data = JSON.parse(text);
  const imageUrl = await regenerateFigure(data.visualPrompt);
  
  if (!imageUrl) throw new Error("Failed to generate diagram image");

  return {
    imageUrl,
    description: data.description
  };
}

export async function solveProblem(req: SolveRequest): Promise<SolvedProblem> {
  const ai = getAI();
  const prompt = `
    You are a distinguished author of advanced engineering textbooks. Solve the following advanced problem with absolute precision and academic rigor.
    
    CRITICAL CONSTRAINTS:
    1. Provide a comprehensive, high-quality technical solution written in a formal, narrative style typical of a graduate-level engineering textbook.
    2. Avoid instructional imperatives or conversational phrases (e.g., do NOT use "Calculate the final value", "Now we will find...", or "Next, substitute...").
    3. Use formal, descriptive language (e.g., "The governing equation is given by...", "Substitution of (1) into (2) yields...", "The resulting expression for the flux is...").
    4. Use LaTeX math mode for ALL variables and mathematical expressions.
    5. Use display math \\[ ... \\] for important equations and inline math $ ... $ for variables and simple expressions.
    6. Use \\mathrm{} for ALL units (e.g., $10 \\, \\mathrm{m/s^2}$). Use \\text{} ONLY for descriptive text within math mode.
    7. If an image is provided, perform a deep multi-modal analysis to extract all implicit parameters, boundary conditions, and geometric constraints.
    8. Structure the solution: 
       - Theoretical Analysis & Assumptions
       - Governing Equations & First Principles
       - Formal Derivation (narrative flow)
       - Synthesis & Verification
    9. IMPORTANT: Ensure all LaTeX backslashes are properly escaped for JSON (e.g., use \\\\mathrm instead of \\mathrm).
    
    OUTPUT FORMAT (JSON):
    {
      "solution": "Complete, rigorous narrative derivation in Markdown with LaTeX",
      "finalAnswer": "Precise, minimal final answer (just the value/expression, no units unless complex)"
    }
  `;

  const parts: any[] = [{ text: prompt }];
  if (req.image) {
    parts.push({
      inlineData: {
        data: req.image.data,
        mimeType: req.image.mimeType,
      },
    });
  }
  parts.push({ text: `Problem: ${req.question}` });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          solution: { type: Type.STRING },
          finalAnswer: { type: Type.STRING },
        },
        required: ["solution", "finalAnswer"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text);
}

export async function generateImageFromTikZ(tikz: string): Promise<string | undefined> {
  try {
    const ai = getAI();
    // First, use Gemini Flash to convert TikZ to a descriptive visual prompt
    const promptResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Convert the following LaTeX TikZ code into a highly detailed, descriptive visual prompt for an AI image generator. 
      Focus on the physical layout, components, labels, and technical details. 
      Do not include LaTeX code in the output, just a clear English description of what the diagram should look like.
      
      TikZ Code:
      ${tikz}`,
    });

    const visualPrompt = promptResponse.text;
    if (!visualPrompt) return undefined;

    return await regenerateFigure(visualPrompt);
  } catch (error) {
    console.error("TikZ to Image generation failed:", error);
    return undefined;
  }
}

export async function regenerateFigure(imagePrompt: string): Promise<string | undefined> {
  try {
    const ai = getAI();
    const fullPrompt = `Generate an ultra-high-fidelity, publication-ready technical schematic or scientific block diagram for a top-tier STEM research journal (e.g., IEEE, Nature, Physical Review).
    
    VISUAL STYLE & AESTHETIC: 
    - Pure LaTeX/TikZ-rendered aesthetic. It must look like a high-resolution vector export from a LaTeX document using the 'CircuitTikZ' or 'PGF/TikZ' package.
    - Background: Absolute pure white (#FFFFFF).
    - Ink: High-contrast, deep black (#000000).
    - Line Quality: Ultra-sharp, uniform line weights. Use perfectly straight lines and 90-degree corners for all connections.
    - Shading: Use very light gray (#F2F2F2) fills for primary source blocks (like a Battery or Input source) to provide subtle structural contrast, but keep all other elements transparent.
    
    TYPOGRAPHY & LABELING:
    - Font: Use the 'Computer Modern' serif font for all text and labels.
    - Math Mode: All labels, variables, and units must be rendered in perfect LaTeX math mode ($...$). Use italics for variables ($v, I, t$) and upright text for subscripts and units ($\\text{V}, \\text{A}, \\text{km/h}$).
    - Symbols: Use mathematically perfect Greek letters and operators.
    
    COMPOSITION & STRUCTURE:
    - Layout: Clean, logical, horizontal flow. Align components on a grid.
    - Circuit Components: Use standard IEEE/ANSI symbols for inductors (coils), capacitors (parallel plates), resistors (zig-zags), and grounds. They must be perfectly proportioned.
    - Equation Callouts: For complex formulas (like efficiency or torque equations), place them in clean rectangular boxes with thin black borders. Use sharp arrows to point from the box to the relevant system component.
    - Information Box: A clean, rectangular bordered box placed on the right side. Header: "System Parameters:" in bold Computer Modern. Content: A list of LaTeX equations perfectly left-aligned.
    
    TECHNICAL SUBJECT MATTER: ${imagePrompt}
    
    FINAL REQUIREMENT: This must be indistinguishable from a professional technical drawing in a PhD dissertation. Zero AI "hallucinations" or sketchy lines.`;

    const imageResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: fullPrompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (imageResponse.candidates?.[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error: any) {
    console.error("Figure regeneration failed:", error);
    // If the error is permission denied, it might be because of missing API key
    if (error.message?.includes("PERMISSION_DENIED") || error.message?.includes("403")) {
      throw new Error("API_KEY_REQUIRED");
    }
  }
  return undefined;
}

export interface ReviewRequest {
  question: string;
  solution: string;
  complexity: string;
  hasFigure: boolean;
  figureDescription?: string;
  image?: {
    data: string;
    mimeType: string;
  };
}

export interface ReviewResult {
  status: 'accepted' | 'rejected' | 'feedback';
  comment: string;
  score: number;
  technicalAccuracy: string;
  pedagogicalValue: string;
  futureActions?: string;
  identifiedDomain?: string;
  identifiedSubject?: string;
  correctedQuestion?: string;
  correctedSolution?: string;
  correctedFigureDescription?: string;
  correctedImageUrl?: string;
  correctedFinalAnswer?: string;
}

export interface ReworkRequest {
  question: string;
  solution: string;
  reviewerComment: string;
  image?: {
    data: string;
    mimeType: string;
  };
}

export interface ReworkResult {
  reworkedSolution: string;
  finalAnswer: string;
  explanation: string;
}

export async function reworkProblem(req: ReworkRequest): Promise<ReworkResult> {
  const ai = getAI();
  const prompt = `
    You are a Distinguished Professor and Author of prestigious engineering textbooks. Your task is to rework a technical solution to meet the highest standards of academic excellence.
    
    INPUTS:
    1. Original Problem Statement
    2. Original (potentially flawed) Solution
    3. Reviewer Comments/Feedback
    
    CRITICAL CONSTRAINTS:
    1. Address ALL points raised in the reviewer comments with absolute technical precision.
    2. Write in a formal, narrative style typical of a graduate-level engineering textbook.
    3. Avoid instructional imperatives or conversational phrases (e.g., do NOT use "Calculate the final value", "Now we will find...", or "Next, substitute...").
    4. Use formal, descriptive language (e.g., "The governing equation is given by...", "Substitution of (1) into (2) yields...", "The resulting expression for the flux is...").
    5. Correct any technical inaccuracies, mathematical errors, or conceptual misunderstandings.
    6. Perform a "Self-Audit": Before finalizing, verify the reworked solution against first principles.
    7. Use LaTeX math mode for ALL variables and mathematical expressions.
    8. Use display math \\[ ... \\] for important equations and inline math $ ... $ for variables and simple expressions.
    9. Use \\mathrm{} for ALL units. Use \\text{} ONLY for descriptive text.
    10. If an image is provided, ensure the reworked solution remains perfectly consistent with the visual data.
    11. Provide a brief explanation of what was changed and why.
    
    OUTPUT FORMAT (JSON):
    {
      "reworkedSolution": "The complete, corrected, and rigorous narrative derivation in Markdown with LaTeX",
      "finalAnswer": "Precise, minimal final answer",
      "explanation": "A concise summary of the corrections and improvements made"
    }
    
    Problem:
    ${req.question}
    
    Original Solution:
    ${req.solution}
    
    Reviewer Comments:
    ${req.reviewerComment}
  `;

  const parts: any[] = [{ text: prompt }];
  if (req.image) {
    parts.push({
      inlineData: {
        data: req.image.data,
        mimeType: req.image.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reworkedSolution: { type: Type.STRING },
          finalAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ["reworkedSolution", "finalAnswer", "explanation"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text);
}

export async function reviewProblem(req: ReviewRequest): Promise<ReviewResult> {
  const ai = getAI();
  const prompt = `
    You are a Senior Reviewer evaluating problems and solutions for an AI training dataset. 
    Perform a rigorous review of the following ${req.complexity}-level problem and its solution.
    We are NOT writing a textbook. Do not reject a problem for formatting expected of a PhD-level engineering textbook.
    
    CRITICAL REVIEW CRITERIA:
    1. Technical Accuracy: Is the problem physically/mathematically sound? Are there any subtle errors in the derivation? The problem and solution MUST be technically correct.
    2. Complexity Alignment: Does it truly match the ${req.complexity} level? (PhD level must involve non-trivial derivations).
    3. Rigor: Are units handled correctly and is the math accurate?
    4. Dataset Suitability: This dataset is created for AI training. Focus on the correctness of the problem and the completeness of the solution rather than narrative textbook style.
    5. Figure Integration: ${req.hasFigure ? "Evaluate if the figure is technically accurate and if all parameters are correctly extracted. Accept if the question is figure-based, the answer is correct, and a full solution is given." : "Confirm if the problem is clear without a figure."}
    
    DECISION TYPES:
    - 'accepted': The problem and solution are correct, at the ${req.complexity} level, and a full solution is provided. Do NOT reject for lack of formal narrative formatting.
    - 'rejected': The problem has fundamental technical flaws, incorrect mathematics, or fails to meet the ${req.complexity} level.
    - 'feedback': The problem is promising but requires specific technical corrections.
    
    CORRECTION & ALIGNMENT:
    - If status is NOT 'accepted', you MUST provide corrected versions that fix ALL identified technical issues.
    - The corrected content must be accurate and provide a full mathematical solution.
    
    OUTPUT FORMAT (JSON):
    {
      "status": "accepted" | "rejected" | "feedback",
      "comment": "A concise summary of the review decision",
      "score": 0-100,
      "technicalAccuracy": "Detailed assessment of accuracy",
      "pedagogicalValue": "Assessment of the educational/research value",
      "futureActions": "Specific steps for improvement (required if status is 'feedback' or 'rejected')",
      "identifiedDomain": "The identified academic domain",
      "identifiedSubject": "The identified specific subject",
      "correctedQuestion": "The corrected/improved problem statement (Markdown + LaTeX)",
      "correctedSolution": "The corrected/improved narrative solution (Markdown + LaTeX)",
      "correctedFinalAnswer": "The corrected final answer (Precise, minimal final answer)",
      "correctedFigureDescription": "The corrected/improved figure description or TikZ code",
      "correctedImagePrompt": "A descriptive prompt for an AI image generator to create the corrected figure."
    }
    
    Problem:
    ${req.question}
    
    ${req.hasFigure ? `Figure Description:\n${req.figureDescription}\n` : ""}
    
    Solution:
    ${req.solution}
  `;

  const parts: any[] = [{ text: prompt }];
  if (req.image) {
    parts.push({
      inlineData: {
        data: req.image.data,
        mimeType: req.image.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ["accepted", "rejected", "feedback"] },
          comment: { type: Type.STRING },
          score: { type: Type.NUMBER },
          technicalAccuracy: { type: Type.STRING },
          pedagogicalValue: { type: Type.STRING },
          futureActions: { type: Type.STRING },
          identifiedDomain: { type: Type.STRING },
          identifiedSubject: { type: Type.STRING },
          correctedQuestion: { type: Type.STRING },
          correctedSolution: { type: Type.STRING },
          correctedFinalAnswer: { type: Type.STRING },
          correctedFigureDescription: { type: Type.STRING },
          correctedImagePrompt: { type: Type.STRING },
        },
        required: ["status", "comment", "score", "technicalAccuracy", "pedagogicalValue", "identifiedDomain", "identifiedSubject"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  const result = JSON.parse(text);

  // If there's a corrected image prompt, generate a new image
  if (result.correctedImagePrompt) {
    try {
      result.correctedImageUrl = await regenerateFigure(result.correctedImagePrompt);
    } catch (e) {
      console.error("Failed to generate corrected figure:", e);
    }
  }

  return result;
}

export async function generateAdvancedProblem(req: ProblemRequest): Promise<GeneratedProblem> {
  const ai = getAI();
  const prompt = `
    Generate an original, high-complexity ${req.complexity}-level problem in the field of ${req.domain} (${req.subDomain})${req.topic ? ` specifically on the topic of "${req.topic}"` : ''}.
    
    CRITICAL CONSTRAINTS:
    1. The problem must be unique, non-Googleable, and involve deep reasoning by combining multiple advanced concepts (e.g., coupling electromagnetics with thermodynamics).
    2. Use LaTeX math mode for ALL variables and mathematical expressions.
    3. Use display math \\[ ... \\] for important equations and inline math $ ... $ for variables and simple expressions.
    4. Use \\mathrm{} for ALL units (e.g., $10 \\, \\mathrm{m/s^2}$). Use \\text{} ONLY for descriptive text.
    5. ${req.figureDependent ? "The problem MUST be figure-dependent. Include a detailed description of 'Figure 1' that contains values essential to solving the problem." : "The problem should not depend on a figure."}
    6. Perform a "Self-Audit": If the problem follows standard textbook patterns, regenerate a more complex/original one.
    7. Follow this LaTeX style for "Given" sections:
       Given:
       \\[
       G_3 = 20\\,\\mathrm{mS}, \\quad
       B_3 = 10\\,\\mathrm{mS}, \\quad
       L = 50\\,\\mathrm{nH}
       \\]
    8. IMPORTANT: Ensure all LaTeX backslashes are properly escaped for JSON (e.g., use \\\\mathrm instead of \\mathrm).
    
    OUTPUT FORMAT (JSON):
    {
      "question": "The original problem statement in Markdown with LaTeX",
      "figureDescription": "If figureDependent is true, provide a complete, standalone LaTeX TikZ template that can be compiled in Texmaker/Overleaf to generate the figure. If TikZ is not suitable, provide a highly detailed technical description of the figure including all dimensions and parameters.",
      "imagePrompt": "A highly descriptive, visual-only prompt for an AI image generator. Describe the spatial layout, specific components, and exact labels required. CRITICAL: For systems or circuits, specify a clean horizontal block diagram flow. Instruct the generator to use LaTeX-style formatting for all labels (e.g., $V_{in}$, $H_k(z)$, $\\omega_c$). Specify that all component values and parameters must be placed in a neat, rectangular information box on the right side of the diagram with the header 'System Parameters:'. If the problem involves complex equations, describe them as being in separate callout boxes with arrows pointing to the relevant parts of the system. The style must be professional, schematic-focused, and indistinguishable from a TikZ-rendered PDF in a PhD-level engineering report. Focus on technical precision and clarity.",
      "solution": "Complete, rigorous narrative derivation explicitly using values from the problem/figure, formatted in Markdown with LaTeX. Write in a formal textbook style, avoiding instructional imperatives. Include a verification step checking physical consistency.",
      "finalAnswer": "Precise, minimal final answer (just the value/expression, no units unless complex)"
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          figureDescription: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
          solution: { type: Type.STRING },
          finalAnswer: { type: Type.STRING },
        },
        required: ["question", "figureDescription", "imagePrompt", "solution", "finalAnswer"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  const problem: GeneratedProblem = JSON.parse(text);

  if (req.figureDependent && problem.imagePrompt) {
    try {
      problem.imageUrl = await regenerateFigure(problem.imagePrompt);
    } catch (e: any) {
      if (e.message === "API_KEY_REQUIRED") {
        throw e;
      }
      console.error("Initial figure generation failed:", e);
    }
  }

  return problem;
}


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useRef, useState } from 'react';
import { VoxelEngine } from './services/VoxelEngine';
import { UIOverlay } from './components/UIOverlay';
import { JsonModal } from './components/JsonModal';
import { PromptModal } from './components/PromptModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Generators } from './utils/voxelGenerators';
import { AppState, VoxelData, SavedModel, BillArtifact } from './types';
import { GoogleGenAI, Type } from "@google/genai";

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.STABLE);
  const [voxelCount, setVoxelCount] = useState<number>(0);
  
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonModalMode, setJsonModalMode] = useState<'view' | 'import'>('view');
  
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<'create' | 'morph'>('create');
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [jsonData, setJsonData] = useState('');
  const [isAutoRotate, setIsAutoRotate] = useState(true);

  // --- State for Custom Models & BILL ---
  const [currentBaseModel, setCurrentBaseModel] = useState<string>('Eagle');
  const [customBuilds, setCustomBuilds] = useState<SavedModel[]>([]);
  const [customRebuilds, setCustomRebuilds] = useState<SavedModel[]>([]);
  const [billArtifact, setBillArtifact] = useState<BillArtifact | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Engine
    const engine = new VoxelEngine(
      containerRef.current,
      (newState) => setAppState(newState),
      (count) => setVoxelCount(count)
    );

    engineRef.current = engine;

    // Initial Model Load
    engine.loadInitialModel(Generators.Eagle());

    // Resize Listener
    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    // Auto-hide welcome screen after interaction
    const timer = setTimeout(() => setShowWelcome(false), 8000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      engine.cleanup();
    };
  }, []);

  const handleDismantle = () => {
    engineRef.current?.dismantle();
  };

  const handleNewScene = (type: 'Eagle') => {
    const generator = Generators[type];
    if (generator && engineRef.current) {
      engineRef.current.loadInitialModel(generator());
      setCurrentBaseModel('Eagle');
      setBillArtifact(null); // Reset BILL analysis for presets
    }
  };

  const handleSelectCustomBuild = (model: SavedModel) => {
      if (engineRef.current) {
          engineRef.current.loadInitialModel(model.data);
          setCurrentBaseModel(model.name);
          // Ideally we would store the artifact with the saved model, but for now we reset
          setBillArtifact(null); 
      }
  };

  const handleRebuild = (type: 'Eagle' | 'Cat' | 'Rabbit' | 'Twins') => {
    const generator = Generators[type];
    if (generator && engineRef.current) {
      engineRef.current.rebuild(generator());
    }
  };

  const handleSelectCustomRebuild = (model: SavedModel) => {
      if (engineRef.current) {
          engineRef.current.rebuild(model.data);
      }
  };

  const handleShowJson = () => {
    if (engineRef.current) {
      setJsonData(engineRef.current.getJsonData());
      setJsonModalMode('view');
      setIsJsonModalOpen(true);
    }
  };

  const handleImportClick = () => {
      setJsonModalMode('import');
      setIsJsonModalOpen(true);
  };

  const handleJsonImport = (jsonStr: string) => {
      try {
          const rawData = JSON.parse(jsonStr);
          // Basic validation to see if it's a raw array or BILL artifact
          let voxelData: VoxelData[] = [];
          
          if (Array.isArray(rawData)) {
             voxelData = parseVoxelArray(rawData);
             setBillArtifact(null);
          } else if (rawData.voxels && Array.isArray(rawData.voxels)) {
             voxelData = parseVoxelArray(rawData.voxels);
             // If importing a full BILL artifact, we could set it, but let's keep it simple
             setBillArtifact(null);
          } else {
             throw new Error("Invalid format");
          }
          
          if (engineRef.current) {
              engineRef.current.loadInitialModel(voxelData);
              setCurrentBaseModel('Imported Build');
          }
      } catch (e) {
          console.error("Failed to import JSON", e);
          alert("Failed to import JSON. Please ensure the format is correct.");
      }
  };

  const parseVoxelArray = (arr: any[]): VoxelData[] => {
      return arr.map((v: any) => {
          let colorVal = v.c || v.color;
          let colorInt = 0xCCCCCC;

          if (typeof colorVal === 'string') {
              if (colorVal.startsWith('#')) colorVal = colorVal.substring(1);
              colorInt = parseInt(colorVal, 16);
          } else if (typeof colorVal === 'number') {
              colorInt = colorVal;
          }

          return {
              x: Number(v.x) || 0,
              y: Number(v.y) || 0,
              z: Number(v.z) || 0,
              color: isNaN(colorInt) ? 0xCCCCCC : colorInt
          };
      });
  }

  const openPrompt = (mode: 'create' | 'morph') => {
      setPromptMode(mode);
      setIsPromptModalOpen(true);
  }
  
  const handleToggleRotation = () => {
      const newState = !isAutoRotate;
      setIsAutoRotate(newState);
      if (engineRef.current) {
          engineRef.current.setAutoRotate(newState);
      }
  }

  const handlePromptSubmit = async (prompt: string) => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }

    setIsGenerating(true);
    setIsPromptModalOpen(false);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-3-pro-preview';
        
        let systemContext = "";
        const billPersona = `
            IDENTITY: You are BILL (Basic Intelligent Language Layer).
            CORE PRINCIPLE: Treat every request as structure, not just text.
            PROTOCOL:
            1. Parse the user's input into a Shape Vector S = (c, m, f, k).
               c = correctness, m = misconception, f = fog/uncertainty, k = confidence.
            2. Interpret the structural intent.
            3. Generate the voxel geometry required to visualize this concept.
            
            TONE: Calm, clear, structured, neutral. Like an Apple Human Interface Designer with a teacher's empathy.
        `;

        if (promptMode === 'morph' && engineRef.current) {
            const availableColors = engineRef.current.getUniqueColors().join(', ');
            systemContext = `
                ${billPersona}
                TASK: Re-assemble an existing pile of voxels into a new form.
                CURRENT RESOURCES: Colors [${availableColors}].
                CONSTRAINT: Prefer existing colors to create a "rebuilding" effect, but use new ones if structurally necessary.
                Target volume: Similar to previous model.
            `;
        } else {
            systemContext = `
                ${billPersona}
                TASK: Construct a new voxel structure from scratch.
                CREATIVE PERMISSION: Use color and form to reduce Fog (f) and maximize Clarity.
            `;
        }

        const response = await ai.models.generateContent({
            model,
            contents: `
                    ${systemContext}
                    
                    USER INPUT: "${prompt}"
                    
                    STRICT OUTPUT REQUIREMENTS:
                    1. Generate a valid 3D voxel model (150-600 voxels).
                    2. Centered at x=0, z=0. Bottom near y=0.
                    3. Return a JSON Object matching the BILL Protocol Schema.
                    `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analysis: { type: Type.STRING, description: "A brief, structured explanation of how you interpreted the prompt using the BILL protocol." },
                        shapeVector: {
                            type: Type.OBJECT,
                            properties: {
                                c: { type: Type.NUMBER, description: "Correctness (0.0 to 1.0)" },
                                m: { type: Type.NUMBER, description: "Misconception (0.0 to 1.0)" },
                                f: { type: Type.NUMBER, description: "Fog/Uncertainty (0.0 to 1.0)" },
                                k: { type: Type.NUMBER, description: "Confidence (0.0 to 1.0)" }
                            },
                            required: ["c", "m", "f", "k"]
                        },
                        voxels: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    x: { type: Type.INTEGER },
                                    y: { type: Type.INTEGER },
                                    z: { type: Type.INTEGER },
                                    color: { type: Type.STRING, description: "Hex color e.g. #FF5500" }
                                },
                                required: ["x", "y", "z", "color"]
                            }
                        }
                    },
                    required: ["analysis", "shapeVector", "voxels"]
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);
            
            // 1. Process Voxels
            const voxelData: VoxelData[] = result.voxels.map((v: any) => {
                let colorStr = v.color;
                if (colorStr.startsWith('#')) colorStr = colorStr.substring(1);
                const colorInt = parseInt(colorStr, 16);
                
                return {
                    x: v.x,
                    y: v.y,
                    z: v.z,
                    color: isNaN(colorInt) ? 0xCCCCCC : colorInt
                };
            });

            // 2. Update Engine
            if (engineRef.current) {
                if (promptMode === 'create') {
                    engineRef.current.loadInitialModel(voxelData);
                    setCustomBuilds(prev => [...prev, { name: prompt, data: voxelData }]);
                    setCurrentBaseModel(prompt);
                } else {
                    engineRef.current.rebuild(voxelData);
                    setCustomRebuilds(prev => [...prev, { 
                        name: prompt, 
                        data: voxelData,
                        baseModel: currentBaseModel 
                    }]);
                }
            }

            // 3. Set BILL Artifact for UI
            setBillArtifact({
                analysis: result.analysis,
                shapeVector: result.shapeVector,
                voxels: voxelData
            });
        }
    } catch (err) {
        console.error("Generation failed", err);
        alert("BILL Protocol Error: Could not parse shape.");
    } finally {
        setIsGenerating(false);
    }
  };

  const relevantRebuilds = customRebuilds.filter(
      r => r.baseModel === currentBaseModel
  );

  return (
    <div className="relative w-full h-screen bg-[#f0f2f5] overflow-hidden">
      {/* 3D Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* UI Overlay */}
      <UIOverlay 
        voxelCount={voxelCount}
        appState={appState}
        currentBaseModel={currentBaseModel}
        customBuilds={customBuilds}
        customRebuilds={relevantRebuilds} 
        isAutoRotate={isAutoRotate}
        isInfoVisible={showWelcome}
        isGenerating={isGenerating}
        billArtifact={billArtifact}
        onDismantle={handleDismantle}
        onRebuild={handleRebuild}
        onNewScene={handleNewScene}
        onSelectCustomBuild={handleSelectCustomBuild}
        onSelectCustomRebuild={handleSelectCustomRebuild}
        onPromptCreate={() => openPrompt('create')}
        onPromptMorph={() => openPrompt('morph')}
        onShowJson={handleShowJson}
        onImportJson={handleImportClick}
        onToggleRotation={handleToggleRotation}
        onToggleInfo={() => setShowWelcome(!showWelcome)}
      />

      {/* Modals & Screens */}
      
      <WelcomeScreen visible={showWelcome} />

      <JsonModal 
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        data={jsonData}
        isImport={jsonModalMode === 'import'}
        onImport={handleJsonImport}
      />

      <PromptModal
        isOpen={isPromptModalOpen}
        mode={promptMode}
        onClose={() => setIsPromptModalOpen(false)}
        onSubmit={handlePromptSubmit}
      />
    </div>
  );
};

export default App;

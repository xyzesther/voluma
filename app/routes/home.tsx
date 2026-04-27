import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import { ArrowRight, Clock, Layers, ArrowUpRight, Box } from 'lucide-react';
import { Button } from "../../components/ui/Button";
import Upload from "../../components/Upload";
import { useNavigate, useOutletContext } from "react-router";
import { createProject, getProjects } from "../../lib/puter.action";
import { useState, useRef, useEffect } from 'react';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
    const navigate = useNavigate();
    const { userId, userName } = useOutletContext<AuthContext>();
    const [projects, setProjects] = useState<DesignItem[]>([]);
    const isCreatingProjectRef = useRef(false);

    const handleUploadComplete = async (base64Data: string) => {
        try {
            if (isCreatingProjectRef.current) return false;
            isCreatingProjectRef.current = true;
            const newId = Date.now().toString();
            const name = `Residence ${newId}`;

            const newItem = {
                id: newId,
                name,
                sourceImage: base64Data,
                renderedImage: undefined,
                timestamp: Date.now(),
                ownerId: userId ?? null,
                sharedBy: userName ?? null,
            }

            const saved = await createProject({ item: newItem, visibility: 'private' })

            if (!saved) {
                console.error('Failed to create project');
                return false;
            }

            setProjects((prev) => [saved, ...prev]);

            navigate(`/visualizer/${newId}`, {
                state:{
                    initialImage: saved.sourceImage,
                    initialRender: saved.renderedImage || null,
                    name
                }
            });

            return true;
        } finally {
            isCreatingProjectRef.current = false;
        }
    }

    useEffect(() => {
        const fetchProjects = async () => {
            const items = await getProjects();

            setProjects(items);
        }

        fetchProjects();
    }, []);
  return (
      <div className="home">
          <Navbar />
          <section className="hero">
              <div className="announce">
                  <div className="announce-dot">
                      <div className="announce-pulse"></div>
                  </div>

                  <p>Introducing Voluma 2.0</p>
              </div>

              <h1>Building Beautiful Spaces at the Speed of Thought with Voluma</h1>

              <p className="subtitle">
                  Voluma is an AI-first design environment that helps you visualize, render,
                  and ship architectural projects faster than ever.
              </p>

              <div className="actions">
                  <a href="#upload" className="cta">
                      Start Building <ArrowRight className="icon"/>
                  </a>

                  <Button variant="outline" size="lg" className="demo">
                      Watch Demo
                  </Button>
              </div>

              <div id="upload" className="upload-shell">
                  <div className="grid-overlay"/>
                  <div className="upload-card">
                      <div className="upload-head">
                          <div className="upload-icon">
                              <Layers className="icon"/>
                          </div>
                          <h3>Upload Your Floor Plan</h3>
                          <p>Supports JPG, PNG formats up to 10MB.</p>
                      </div>

                      <Upload onComplete={handleUploadComplete} />
                  </div>
              </div>
          </section>

          <section className="projects" id="projects">
              <div className="section-inner">
                  <div className="section-head">
                      <div className="copy">
                          <h2>Recent Projects</h2>
                          <p>Your Latest Work and Shared Community Projects, All in One Place.</p>
                      </div>
                  </div>


                  <div className="projects-grid">
                      {projects.map(({id, name, renderedImage, sourceImage,
                      timestamp, ownerId, isPublic, sharedBy}) => (
                          <div key={id} className="project-card group" onClick={() => navigate(`/visualizer/${id}`)}>
                              <div className="preview">
                                  <img src={renderedImage || sourceImage} alt="Project"/>
                                  {isPublic && (
                                      <div className="badge">
                                          <span>Community</span>
                                      </div>
                                  )}
                              </div>

                              <div className="card-body">
                                  <div>
                                      <h3>{name || `Residence ${id}`} </h3>
                                      <div className="meta">
                                          <Clock size={12}/>
                                          <span suppressHydrationWarning>{new Date(timestamp).toLocaleDateString()}</span>
                                          <span>{ownerId === userId ? "By You" : `By ${sharedBy ?? "Community"}`}</span>
                                      </div>
                                  </div>
                                  <div className="arrow">
                                      <ArrowUpRight size={18}/>
                                  </div>
                              </div>
                          </div>
                      ))}

                  </div>
              </div>
          </section>
      </div>
  )
}

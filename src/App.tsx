import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Markdown from 'react-markdown';
import { searchVacancies, parseCV, generateCoverLetter, optimizeCV, decodeJob, generateRecruiterMessage, simulateInterview, improveLinkedInProfile } from './services/geminiService';
import { Vacancy, ParsedCV } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export default function App() {
  const [cv, setCv] = useState<ParsedCV | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [query, setQuery] = useState('');
  const [minSalary, setMinSalary] = useState(4000000);
  const [toastMsg, setToastMsg] = useState('');
  const [modalContent, setModalContent] = useState<{title: string, content: React.ReactNode} | null>(null);
  const [filters, setFilters] = useState({
    remoteOnly: true,
    spanishOnly: false,
    maxEnglishA2: true
  });

  const [isGeneratingAction, setIsGeneratingAction] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(' ') + '\n';
        }
      } else {
        text = await file.text();
      }
      
      const parsed = await parseCV(text);
      parsed.name = file.name;
      setCv(parsed);
    } catch (error) {
      console.error("Error parsing CV", error);
      alert("Error al analizar el CV. Por favor, asegúrate de subir un archivo PDF o de texto válido.");
    } finally {
      setIsParsing(false);
      // Reset input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      let modalities = ['Remoto', 'Híbrido', 'Presencial'];
      if (filters.remoteOnly) modalities = ['Remoto', 'Híbrido'];

      const searchFilters = {
        countries: ['Colombia', 'Remoto Global'],
        modalities,
        minSalary,
        roles: query ? [query] : ['SDR', 'BDR', 'Account Executive', 'KAM', 'Account Manager', 'RevOps', 'SalesOps'],
        seniority: ['Senior', 'Manager', 'Director', 'Semi-Senior'],
        spanishOnly: filters.spanishOnly,
        maxEnglishA2: filters.maxEnglishA2
      };
      const results = await searchVacancies(searchFilters, cv?.rawText);
      setVacancies(results);
    } catch (error) {
      console.error("Error searching vacancies", error);
      alert("Error al buscar vacantes. Por favor, intenta de nuevo.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImproveLinkedIn = async () => {
    if (!cv) return;
    setIsGeneratingAction(true);
    setModalContent({ title: 'Analizando Perfil...', content: <div className="loading-spinner"></div> });
    try {
      const guide = await improveLinkedInProfile(cv.rawText);
      setModalContent({
        title: 'Guía de Optimización LinkedIn',
        content: <div className="markdown-body"><Markdown>{guide}</Markdown></div>
      });
    } catch (error) {
      setModalContent({ title: 'Error', content: <p>No se pudo generar la guía.</p> });
    } finally {
      setIsGeneratingAction(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  return (
    <>
      <header>
        <div className="logo">
          <div className="logo-icon">🎯</div>
          Hunter<span>Pro</span>
        </div>
        <div className="header-right">
          {cv && (
            <button className="btn-optimize" onClick={handleImproveLinkedIn} disabled={isGeneratingAction} style={{marginRight: '10px'}}>
              ✨ Mejorar LinkedIn
            </button>
          )}
          <label className={`cv-upload-btn ${cv ? 'cv-loaded' : ''}`}>
            <span id="cvIcon">{cv ? '✅' : '📄'}</span>
            <span id="cvText">{isParsing ? 'Analizando...' : cv ? cv.name : 'Cargar mi Hoja de Vida (PDF)'}</span>
            <input type="file" accept=".txt,.pdf" className="sr-only" onChange={handleFileUpload} disabled={isParsing} />
          </label>
        </div>
      </header>

      <section className="hero">
        <div className="hero-eyebrow">🇨🇴 Colombia · España · Remoto Global · Solo en Español</div>
        <h1>Vacantes Senior B2B<br/><em>Alto Valor · SaaS · Tech</em></h1>
        <p className="hero-sub">Especialista en búsquedas precisas y verificadas. Ofertas recientes (máx 2 meses) · Salario mínimo $4.000.000 COP · Sin requisito de inglés avanzado · Match inteligente con tu CV</p>

        <div className="search-wrap">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por rol, empresa o ciudad… ej: Account Executive, RevOps, SDR" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? '⟳ Buscando…' : 'Buscar Vacantes →'}
            </button>
          </div>
        </div>

        <div className="role-chips">
          <div className={`chip ${query === 'Comercial' ? 'active' : ''}`} onClick={() => setQuery('Comercial')}>
            🏢 Comercial (SDR, BDR, AE, KAM, Inside Sales)
          </div>
          <div className={`chip ${query === 'RevOps' ? 'active' : ''}`} onClick={() => setQuery('RevOps')}>
            ⚙️ RevOps (SalesOps, CRM Admin, Customer Success)
          </div>
        </div>
      </section>

      <div className="top-filters-bar">
        <div className="filter-dropdown">
          <label>💰 Salario Mínimo</label>
          <select value={minSalary} onChange={(e) => setMinSalary(parseInt(e.target.value))}>
            <option value="4000000">$4.0M COP (≈ $1000 USD)</option>
            <option value="5000000">$5.0M COP (≈ $1250 USD)</option>
            <option value="6000000">$6.0M COP (≈ $1500 USD)</option>
            <option value="8000000">$8.0M COP (≈ $2000 USD)</option>
            <option value="10000000">$10.0M COP (≈ $2500 USD)</option>
            <option value="12000000">$12.0M COP (≈ $3000 USD)</option>
            <option value="15000000">$15.0M COP (≈ $3750 USD)</option>
            <option value="20000000">$20.0M COP (≈ $5000 USD)</option>
          </select>
        </div>

        <div className="filter-dropdown">
          <label>🌍 Modalidad</label>
          <select value={filters.remoteOnly ? "remote" : "all"} onChange={(e) => setFilters(f => ({...f, remoteOnly: e.target.value === "remote"}))}>
            <option value="all">Todas (Remoto, Híbrido, Presencial)</option>
            <option value="remote">Solo Remoto / Híbrido</option>
          </select>
        </div>

        <div className="filter-dropdown">
          <label>🗣️ Idioma Español</label>
          <select value={filters.spanishOnly ? "spanish" : "all"} onChange={(e) => setFilters(f => ({...f, spanishOnly: e.target.value === "spanish"}))}>
            <option value="all">Cualquier Idioma</option>
            <option value="spanish">Solo 100% Español</option>
          </select>
        </div>

        <div className="filter-dropdown">
          <label>🇬🇧 Nivel de Inglés</label>
          <select value={filters.maxEnglishA2 ? "a2" : "all"} onChange={(e) => setFilters(f => ({...f, maxEnglishA2: e.target.value === "a2"}))}>
            <option value="all">Cualquier Nivel</option>
            <option value="a2">Máximo Inglés A2</option>
          </select>
        </div>
      </div>

      <div className="main">
        <div className="results-area">
          <div className="results-header">
            <div className="results-count"><strong>{vacancies.length}</strong> vacantes encontradas</div>
          </div>

          <div id="cardContainer">
            {isSearching ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Buscando las mejores vacantes Senior SaaS...</p>
              </div>
            ) : vacancies.length > 0 ? (
              vacancies.map(vac => <VacancyCard key={vac.id} vacancy={vac} cv={cv} onCopy={showToast} setModalContent={setModalContent} />)
            ) : (
              <div className="loading-state">
                <p>No hay resultados aún. Ajusta los filtros y haz clic en Buscar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`copied-toast ${toastMsg ? 'show' : ''}`} id="toast">{toastMsg}</div>

      {modalContent && (
        <div className="modal-overlay" onClick={() => setModalContent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalContent.title}</h2>
              <button className="modal-close" onClick={() => setModalContent(null)}>✕</button>
            </div>
            <div className="modal-body">
              {modalContent.content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function VacancyCard({ vacancy, cv, onCopy, setModalContent }: { vacancy: Vacancy, cv: ParsedCV | null, onCopy: (msg: string) => void, setModalContent: (content: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const matchScore = vacancy.matchAnalysis?.score || 0;
  const matchClass = matchScore >= 80 ? 'high' : matchScore >= 60 ? 'mid' : 'low';
  
  const modalityTag = vacancy.modality?.toLowerCase().includes('remoto') ? 'tag-remote' :
                      vacancy.modality?.toLowerCase().includes('híbrido') ? 'tag-hybrid' : 'tag-presencial';
  const modalityText = vacancy.modality?.toLowerCase().includes('remoto') ? '🌐 Remoto' :
                       vacancy.modality?.toLowerCase().includes('híbrido') ? '⚡ Híbrido' : '🏢 Presencial';

  const hasEmail = !!vacancy.recruiter?.email && vacancy.recruiter.email !== 'No disponible' && vacancy.recruiter.email !== 'No identificado';
  const hasPhone = !!vacancy.recruiter?.phone && vacancy.recruiter.phone !== 'No disponible' && vacancy.recruiter.phone !== 'No identificado';

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    onCopy(msg);
  };

  const handleGenerateCoverLetter = async () => {
    if (!cv?.rawText) return;
    setIsGenerating(true);
    try {
      const letter = await generateCoverLetter(cv.rawText, vacancy);
      setModalContent({
        title: '✍️ Carta de Presentación',
        content: (
          <div className="markdown-body">
            <Markdown>{letter}</Markdown>
            <button className="btn-apply" style={{marginTop: '1rem'}} onClick={() => copyToClipboard(letter, 'Carta copiada')}>Copiar Carta</button>
          </div>
        )
      });
    } catch (e) {
      console.error(e);
      alert('Error al generar la carta');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeCV = async () => {
    if (!cv?.rawText) return;
    setIsGenerating(true);
    try {
      const optimization = await optimizeCV(cv.rawText, vacancy);
      setModalContent({
        title: '✨ Optimización de CV',
        content: (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div>
              <h3 style={{color: 'var(--gold)', marginBottom: '0.5rem'}}>Resumen Profesional Sugerido</h3>
              <p style={{background: 'var(--surface2)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem'}}>{optimization.resumen_profesional_sugerido}</p>
            </div>
            
            <div>
              <h3 style={{color: 'var(--gold)', marginBottom: '0.5rem'}}>Logros a Agregar</h3>
              <ul style={{background: 'var(--surface2)', padding: '1rem 1rem 1rem 2rem', borderRadius: '8px', fontSize: '0.9rem'}}>
                {optimization.logros_a_agregar?.map((l: string, i: number) => <li key={i} style={{marginBottom: '0.5rem'}}>{l}</li>)}
              </ul>
            </div>

            <div>
              <h3 style={{color: 'var(--gold)', marginBottom: '0.5rem'}}>Bullets a Reescribir</h3>
              {optimization.bullets_a_reescribir?.map((b: any, i: number) => (
                <div key={i} style={{background: 'var(--surface2)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem', fontSize: '0.85rem'}}>
                  <div style={{color: 'var(--red)', marginBottom: '0.25rem'}}>❌ Original: {b.original}</div>
                  <div style={{color: 'var(--green)', marginBottom: '0.5rem'}}>✅ Mejorado: {b.mejorado}</div>
                  <div style={{color: 'var(--text-muted)', fontStyle: 'italic'}}>💡 Razón: {b.razon}</div>
                </div>
              ))}
            </div>

            <div>
              <h3 style={{color: 'var(--gold)', marginBottom: '0.5rem'}}>Orden Recomendado</h3>
              <div style={{background: 'var(--surface2)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem'}}>
                {optimization.orden_secciones_recomendado?.join(' ➔ ')}
              </div>
            </div>
            
            <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic'}}>
              {optimization.observaciones_generales}
            </div>
          </div>
        )
      });
    } catch (e) {
      console.error(e);
      alert('Error al optimizar CV');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDecodeJob = async () => {
    setIsGenerating(true);
    try {
      const decoded = await decodeJob(vacancy);
      setModalContent({
        title: '🔍 Decodificador de Vacante',
        content: (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div>
              <h3 style={{color: 'var(--accent)', marginBottom: '0.5rem'}}>¿Qué buscan realmente?</h3>
              <p style={{background: 'var(--surface2)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem'}}>{decoded.que_buscan_realmente}</p>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <div>
                <h3 style={{color: 'var(--accent)', marginBottom: '0.5rem'}}>Habilidades Diferenciadoras</h3>
                <ul style={{background: 'var(--surface2)', padding: '1rem 1rem 1rem 2rem', borderRadius: '8px', fontSize: '0.9rem', height: '100%'}}>
                  {decoded.habilidades_diferenciadores?.map((h: string, i: number) => <li key={i} style={{marginBottom: '0.5rem'}}>{h}</li>)}
                </ul>
              </div>
              <div>
                <h3 style={{color: 'var(--accent)', marginBottom: '0.5rem'}}>Señales</h3>
                <div style={{background: 'var(--surface2)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', height: '100%'}}>
                  <div style={{color: 'var(--green)', marginBottom: '0.5rem'}}><strong>Positivas:</strong> {decoded.senales_positivas?.join(', ')}</div>
                  <div style={{color: 'var(--red)'}}><strong>Alerta:</strong> {decoded.senales_de_alerta?.join(', ') || 'Ninguna detectada'}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{color: 'var(--accent)', marginBottom: '0.5rem'}}>Preguntas Probables en Entrevista</h3>
              <ul style={{background: 'var(--surface2)', padding: '1rem 1rem 1rem 2rem', borderRadius: '8px', fontSize: '0.9rem'}}>
                {decoded.preguntas_entrevista_probables?.map((p: string, i: number) => <li key={i} style={{marginBottom: '0.5rem'}}>{p}</li>)}
              </ul>
            </div>

            <div style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>
              <strong>Seniority Real Estimado:</strong> {decoded.nivel_seniority_real}
            </div>
          </div>
        )
      });
    } catch (e) {
      console.error(e);
      alert('Error al decodificar vacante');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMessage = async () => {
    if (!cv?.rawText) return;
    setIsGenerating(true);
    setModalContent({ title: 'Generando Mensaje...', content: <div className="loading-spinner"></div> });
    try {
      const message = await generateRecruiterMessage(vacancy, cv.rawText, vacancy.matchAnalysis?.score || 0);
      setModalContent({
        title: `Mensaje para ${vacancy.recruiter?.name || 'Reclutador'}`,
        content: (
          <div>
            <div className="markdown-body">
              <Markdown>{message}</Markdown>
            </div>
            <button 
              className="btn-apply" 
              style={{marginTop: '1.5rem'}}
              onClick={() => copyToClipboard(message, 'Mensaje copiado')}
            >
              📋 Copiar Mensaje
            </button>
          </div>
        )
      });
    } catch (error) {
      setModalContent({ title: 'Error', content: <p>No se pudo generar el mensaje.</p> });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulateInterview = async () => {
    if (!cv?.rawText) return;
    setIsGenerating(true);
    setModalContent({ title: 'Preparando Simulación...', content: <div className="loading-spinner"></div> });
    try {
      const simulation = await simulateInterview(vacancy, cv.rawText);
      setModalContent({
        title: `Simulación de Entrevista: ${vacancy.company}`,
        content: <div className="markdown-body"><Markdown>{simulation}</Markdown></div>
      });
    } catch (error) {
      setModalContent({ title: 'Error', content: <p>No se pudo generar la simulación.</p> });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="vacancy-card">
      {vacancy.matchAnalysis && (
        <div className={`match-score ${matchClass}`} onClick={() => {
          setModalContent({
            title: '📊 Análisis de Match',
            content: (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div style={{textAlign: 'center', fontSize: '3rem', fontWeight: 800, color: `var(--${matchClass === 'high' ? 'green' : matchClass === 'mid' ? 'gold' : 'red'})`}}>
                  {matchScore}%
                </div>
                <p style={{textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem'}}>{vacancy.matchAnalysis?.recommendation}</p>
                
                {vacancy.matchAnalysis?.cultureFit && (
                  <div style={{background: 'var(--surface2)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--gold)'}}>
                    <h3 style={{color: 'var(--gold)', marginBottom: '0.25rem', fontSize: '0.9rem'}}>🎯 Cultura de Ventas (Hunter vs Farmer)</h3>
                    <p style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{vacancy.matchAnalysis.cultureFit}</p>
                  </div>
                )}

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <h3 style={{color: 'var(--green)', marginBottom: '0.5rem'}}>Fortalezas</h3>
                    <ul style={{background: 'var(--surface2)', padding: '1rem 1rem 1rem 2rem', borderRadius: '8px', fontSize: '0.85rem'}}>
                      {vacancy.matchAnalysis?.matchingStrengths?.map((s, i) => <li key={i} style={{marginBottom: '0.25rem'}}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 style={{color: 'var(--red)', marginBottom: '0.5rem'}}>Brechas</h3>
                    <ul style={{background: 'var(--surface2)', padding: '1rem 1rem 1rem 2rem', borderRadius: '8px', fontSize: '0.85rem'}}>
                      {vacancy.matchAnalysis?.missingSkills?.map((s, i) => <li key={i} style={{marginBottom: '0.25rem'}}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )
          });
        }} style={{cursor: 'pointer'}} title="Ver análisis detallado">
          {matchScore}%
          <div className="match-label">MATCH</div>
        </div>
      )}

      <div className="card-top">
        <div className="company-logo">🏢</div>
        <div className="card-title-block">
          <div className="card-title">{vacancy.title}</div>
          <div className="card-company">
            {vacancy.company}
            <span className="company-type">Empresa</span>
          </div>
        </div>
      </div>

      <div className="tags-row">
        <span className={`tag ${modalityTag}`}>{modalityText}</span>
        <span className="tag tag-location">📍 {vacancy.location}</span>
      </div>

      <div className="salary-block">
        <div>
          <div className="salary-main">{vacancy.salary}</div>
          <div className="salary-detail">{vacancy.contractType}</div>
        </div>
      </div>

      <div className="recruiter-block">
        <div className="recruiter-header">👤 Reclutador Identificado</div>
        <div className="recruiter-info">
          <div className="recruiter-avatar">👤</div>
          <div>
            <div className="recruiter-name">{vacancy.recruiter?.name || 'No identificado'}</div>
            <div className="recruiter-role">{vacancy.recruiter?.company || vacancy.company}</div>
          </div>
        </div>
        <div className="recruiter-contacts">
          {hasEmail ? (
            <button className="contact-pill email" onClick={() => copyToClipboard(vacancy.recruiter.email, '✉️ Email copiado')}>
              ✉️ {vacancy.recruiter.email}
            </button>
          ) : (
            <span className="contact-pill copy-btn">✉️ Email no público</span>
          )}
          {hasPhone && (
            <button className="contact-pill phone" onClick={() => copyToClipboard(vacancy.recruiter.phone!, '📱 Teléfono copiado')}>
              📱 {vacancy.recruiter.phone}
            </button>
          )}
          {vacancy.recruiter?.linkedin && vacancy.recruiter.linkedin !== 'No disponible' && vacancy.recruiter.linkedin !== 'No identificado' && (
            <a className="contact-pill linkedin" href={vacancy.recruiter.linkedin} target="_blank" rel="noreferrer">
              🔗 Ver LinkedIn
            </a>
          )}
        </div>
      </div>

      {vacancy.companyInsights && (
        <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text)' }}>
          <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>💡 Company Insights (Deep Search):</strong>
          {vacancy.companyInsights}
        </div>
      )}

      {vacancy.mappedPortals && vacancy.mappedPortals.length > 0 && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text)' }}>
          <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>🌐 PORTALES MAPEADOS:</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {vacancy.mappedPortals.map((portal, idx) => (
              <span key={idx} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                {portal}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
        {vacancy.description?.substring(0, 200)}...
      </div>

      <div className="card-actions">
        <a className="btn-apply" href={vacancy.applicationLink} target="_blank" rel="noreferrer">🚀 Ver Vacante Completa</a>
        {cv && (
          <>
            <button className="btn-optimize" onClick={handleGenerateMessage} disabled={isGenerating}>
              {isGenerating ? '⏳' : '✉️'} Generar Mensaje
            </button>
            <button className="btn-optimize" onClick={handleSimulateInterview} disabled={isGenerating}>
              {isGenerating ? '⏳' : '🎤'} Simular Entrevista
            </button>
            <button className="btn-optimize" onClick={handleOptimizeCV} disabled={isGenerating}>
              {isGenerating ? '⏳' : '✨'} Optimizar CV
            </button>
          </>
        )}
        <button className="btn-optimize" onClick={handleDecodeJob} disabled={isGenerating}>
          {isGenerating ? '⏳' : '🔍'} Analizar Vacante
        </button>
        <button className="btn-optimize" onClick={() => onCopy('Vacante guardada')}>💾 Guardar</button>
      </div>

      <button className="expand-toggle" onClick={() => setExpanded(!expanded)}>
        <span>📋 Ver descripción completa y requisitos</span>
        <span>{expanded ? '▴' : '▾'}</span>
      </button>
      
      {expanded && (
        <div className={`expand-content ${expanded ? 'open' : ''}`}>
          <div style={{ marginBottom: '1rem' }}>{vacancy.description}</div>
          <strong style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            REQUISITOS PRINCIPALES
          </strong>
          <ul className="req-list">
            {vacancy.requirements?.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Publicado: {vacancy.publishedDate}
          </div>
        </div>
      )}
    </div>
  );
}

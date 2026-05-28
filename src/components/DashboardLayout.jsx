import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

/**
 * DashboardLayout
 * Envolve todas as páginas internas da plataforma.
 * Uso no router:
 *
 *   <Route element={<DashboardLayout />}>
 *     <Route path="/dashboard"  element={<OverviewPage />} />
 *     <Route path="/documents"  element={<DocumentsPage />} />
 *     <Route path="/flashcards" element={<FlashcardsPage />} />
 *     <Route path="/quizzes"    element={<QuizzesPage />} />
 *   </Route>
 */
export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`dl-root${collapsed ? ' dl-root--collapsed' : ''}`}>

      {/* Overlay mobile (fecha ao clicar fora) */}
      {mobileOpen && (
        <div
          className="dl-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
      />

      {/* Área de conteúdo principal */}
      <main className="dl-main">
        {/* Topbar mobile */}
        <div className="dl-topbar">
          <button
            className="dl-topbar__menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14"/>
            </svg>
          </button>
          <span className="dl-topbar__brand">Bright EdTech</span>
        </div>

        {/* Conteúdo da página atual (via React Router <Outlet>) */}
        <div className="dl-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
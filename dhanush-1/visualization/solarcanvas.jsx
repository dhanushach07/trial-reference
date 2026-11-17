'use client';

import { useState, useMemo } from 'react';
import { useObservatory } from '@/context/ObservatoryContext';

// Helper to convert polar coordinates (cx, cy, radius, angle in radians) to cartesian (x, y)
function polarToCartesian(centerX, centerY, radius, angleInRadians) {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Generates an SVG path string for an annular sector wedge
function describeArcSector(x, y, innerRadius, outerRadius, startAngle, endAngle) {
  const startInner = polarToCartesian(x, y, innerRadius, startAngle);
  const endInner = polarToCartesian(x, y, innerRadius, endAngle);
  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, endAngle);

  const angleDiff = endAngle - startAngle;
  const largeArcFlag = angleDiff <= Math.PI ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 0, startInner.x, startInner.y,
    'Z',
  ].join(' ');
}

export default function SolarCanvas() {
  const { apps, permissions, connections, selectedNode, selectNode } = useObservatory();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isCoreGlowing, setIsCoreGlowing] = useState(false);
  const [expandedRing, setExpandedRing] = useState(null); // null | 1 | 2 | 3
  const [viewMode, setViewMode] = useState('focused'); // 'focused' | 'expanded'

  const cx = 410;
  const cy = 370;

  // ── Dynamic Concentric Radii with Circular Gaps for Labels ─────────
  // Gap 0-1: 58 to 76 (18px)
  // Gap 1-2: r1Outer to r2Inner (26px gap with labels)
  // Gap 2-3: r2Outer to r3Inner (26px gap with labels)
  const r0 = 58; // Core radius

  const r1Inner = 76;
  const r1Outer = expandedRing === 1 ? 162 : 146;

  const gap12Mid = (r1Outer + 26 + r1Outer) / 2;
  const r2Inner = r1Outer + 26;
  const r2Outer = expandedRing === 2 ? r2Inner + 92 : r2Inner + 74;

  const gap23Mid = (r2Outer + 26 + r2Outer) / 2;
  const r3Inner = r2Outer + 26;
  const r3Outer = expandedRing === 3 ? r3Inner + 96 : r3Inner + 76;

  // ── Ring 1 Sectors: Drive Root / Program Files ─────────────────────
  const ring1Raw = useMemo(() => [
    {
      id: 'sec-pf-google',
      name: 'C:\\Program Files\\Google',
      shortName: 'PROG / GOOGLE',
      sizeMB: 1240,
      app: apps.find((a) => a.id === 'app-chrome'),
      risk: 'medium',
      tier: 'System Drive / Program Files',
      desc: 'System-wide Google browser binaries & rendering engine',
    },
    {
      id: 'sec-pf-teams',
      name: 'C:\\Program Files\\WindowsApps',
      shortName: 'PROG / MS APPS',
      sizeMB: 820,
      app: apps.find((a) => a.id === 'app-teams'),
      risk: 'low',
      tier: 'System Drive / Program Files',
      desc: 'Containerized Microsoft enterprise suite',
    },
    {
      id: 'sec-pf-dev',
      name: 'C:\\Program Files\\Development',
      shortName: 'PROG / DEV TOOLS',
      sizeMB: 540,
      risk: 'low',
      tier: 'System Drive / Program Files',
      desc: 'Shared toolchain compilers, Node.js & runtime packages',
    },
    {
      id: 'sec-sys32-tools',
      name: 'C:\\Windows\\System32\\Tools',
      shortName: 'SYS / SYSTEM32',
      sizeMB: 480,
      app: apps.find((a) => a.id === 'app-pwsh'),
      risk: 'high',
      tier: 'System Drive / Program Files',
      desc: 'PowerShell automation host & background daemons',
    },
    {
      id: 'sec-pf-common',
      name: 'C:\\Program Files\\Common Files',
      shortName: 'PROG / COMMON',
      sizeMB: 360,
      risk: 'low',
      tier: 'System Drive / Program Files',
      desc: 'Shared runtime dynamic link libraries and font caches',
    },
  ], [apps]);

  // ── Ring 2 Sectors: User Space / YouTube & Installed Apps ───────────
  const ring2Raw = useMemo(() => [
    {
      id: 'sec-usr-youtube',
      name: 'C:\\Users\\User\\AppData\\Local\\YouTube',
      shortName: 'USER / YOUTUBE',
      pathTag: '..../youtube',
      sizeMB: 640,
      app: apps.find((a) => a.id === 'app-youtube'),
      risk: 'low',
      tier: 'User Space (..../youtube)',
      desc: 'Progressive Web App desktop runtime & streaming client',
      isHeroApp: true,
    },
    {
      id: 'sec-usr-vscode',
      name: 'C:\\Users\\User\\AppData\\Programs\\Code',
      shortName: 'USER / DEV IDE',
      pathTag: '..../vscode',
      sizeMB: 750,
      app: apps.find((a) => a.id === 'app-vscode'),
      risk: 'low',
      tier: 'User Space (..../youtube)',
      desc: 'User-space local code editor workspace & extensions',
    },
    {
      id: 'sec-usr-chrome-cache',
      name: 'C:\\Users\\User\\AppData\\Local\\Google\\Chrome',
      shortName: 'USER / WEB CACHE',
      pathTag: '..../chrome-cache',
      sizeMB: 680,
      risk: 'medium',
      tier: 'User Space (..../youtube)',
      desc: 'Browser session databases, cookies & cached streams',
    },
    {
      id: 'sec-usr-discord',
      name: 'C:\\Users\\User\\AppData\\Local\\Discord',
      shortName: 'USER / DISCORD',
      pathTag: '..../discord',
      sizeMB: 480,
      app: apps.find((a) => a.id === 'app-discord'),
      risk: 'low',
      tier: 'User Space (..../youtube)',
      desc: 'Local communication client cache and binary',
    },
    {
      id: 'sec-usr-spotify',
      name: 'C:\\Users\\User\\AppData\\Roaming\\Spotify',
      shortName: 'USER / SPOTIFY',
      pathTag: '..../spotify',
      sizeMB: 390,
      app: apps.find((a) => a.id === 'app-spotify'),
      risk: 'low',
      tier: 'User Space (..../youtube)',
      desc: 'User audio streaming cache & playback profile',
    },
  ], [apps]);

  // ── Ring 3 Sectors: Outer User Storage & Main Directories ───────────
  const ring3Raw = useMemo(() => [
    {
      id: 'sec-out-downloads',
      name: 'C:\\Users\\User\\Apps\\Downloads',
      shortName: 'USER / DOWNLOADS',
      pathTag: '...../apps/downloads',
      sizeMB: 980,
      risk: 'high',
      tier: 'User Storage (...../apps/downloads)',
      desc: 'User downloads directory, installer packages & downloaded payloads',
      isHeroDirectory: true,
    },
    {
      id: 'sec-out-media',
      name: 'C:\\Users\\User\\Downloads\\Media',
      shortName: 'USER / MEDIA',
      pathTag: '...../downloads/media',
      sizeMB: 640,
      risk: 'low',
      tier: 'User Storage (...../apps/downloads)',
      desc: 'Downloaded video streams, offline content & cached feeds',
    },
    {
      id: 'sec-out-workspace',
      name: 'C:\\Users\\User\\Desktop\\Workspace',
      shortName: 'USER / DESKTOP',
      pathTag: '...../desktop/workspace',
      sizeMB: 520,
      risk: 'low',
      tier: 'User Storage (...../apps/downloads)',
      desc: 'Active desktop development workspace & project trees',
    },
    {
      id: 'sec-out-docs',
      name: 'C:\\Users\\User\\Documents\\SecurityVault',
      shortName: 'USER / DOCUMENTS',
      pathTag: '...../documents/vault',
      sizeMB: 410,
      perm: permissions.find((p) => p.id === 'perm-filesystem'),
      risk: 'medium',
      tier: 'User Storage (...../apps/downloads)',
      desc: 'Encrypted telemetry vault & user credential store',
    },
    {
      id: 'sec-out-temp',
      name: 'C:\\Users\\User\\AppData\\Local\\Temp',
      shortName: 'USER / TEMP INBOX',
      pathTag: '...../local/temp',
      sizeMB: 350,
      risk: 'low',
      tier: 'User Storage (...../apps/downloads)',
      desc: 'Transient scratch files and extraction workspaces',
    },
  ], [permissions]);

  // Proportional angle calculation (Allocates 2*PI radians based on sizeMB)
  const computeProportionalSectors = (items, innerRadius, outerRadius, ringLevel) => {
    const totalSize = items.reduce((acc, item) => acc + item.sizeMB, 0);
    let currentAngle = -Math.PI / 2; // Start from 12 o'clock

    return items.map((item) => {
      const angleFraction = (item.sizeMB / totalSize) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleFraction;
      currentAngle = endAngle;

      const midAngle = (startAngle + endAngle) / 2;
      const midRadius = (innerRadius + outerRadius) / 2;
      const labelPos = polarToCartesian(cx, cy, midRadius, midAngle);
      const percentage = ((item.sizeMB / totalSize) * 100).toFixed(1);

      return {
        ...item,
        ring: ringLevel,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        labelPos,
        percentage,
      };
    });
  };

  const ring1Sectors = useMemo(() => computeProportionalSectors(ring1Raw, r1Inner, r1Outer, 1), [ring1Raw, r1Inner, r1Outer]);
  const ring2Sectors = useMemo(() => computeProportionalSectors(ring2Raw, r2Inner, r2Outer, 2), [ring2Raw, r2Inner, r2Outer]);
  const ring3Sectors = useMemo(() => computeProportionalSectors(ring3Raw, r3Inner, r3Outer, 3), [ring3Raw, r3Inner, r3Outer]);

  const allSectors = useMemo(() => [
    ...ring1Sectors,
    ...ring2Sectors,
    ...ring3Sectors,
  ], [ring1Sectors, ring2Sectors, ring3Sectors]);

  // Handle Sector Click: Automatically expand piechart if in initial focused mode
  const handleSectorClick = (sec) => {
    if (viewMode === 'focused') {
      setViewMode('expanded');
    }
    // Toggle ring expansion for tactile exploration
    setExpandedRing((prev) => (prev === sec.ring ? null : sec.ring));

    if (sec.app) selectNode(sec.app);
    else if (sec.perm) selectNode(sec.perm);
    else if (sec.conn) selectNode(sec.conn);
    else selectNode({ ...sec, nodeType: 'sector' });
  };

  // Handle Core Click: Greyed out by default, glows on tap
  const handleCoreClick = () => {
    const nextGlowing = !isCoreGlowing;
    setIsCoreGlowing(nextGlowing);
    selectNode({
      id: 'sec-core-root',
      name: 'Windows Kernel & Root (C:\\Windows)',
      description: 'Core Windows executive binaries, kernel system drivers & telemetry daemons.',
      layer: 1,
      nodeType: 'core',
      status: nextGlowing ? 'TELEMETRY ACTIVE' : 'DORMANT / SECURE',
      riskLevel: 'low',
      path: 'C:\\Windows\\System32',
      sizeMB: 24800,
    });
  };

  const activeFocus = hoveredItem || selectedNode;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Precision Background Millimeter Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.45,
        }}
      />

      {/* Top Telemetry Header & Expansion Mode Switcher */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 800,
              background: '#121212',
              color: '#ffffff',
              padding: '3px 7px',
              borderRadius: '2px',
              letterSpacing: '0.06em',
            }}
          >
            FIG 01.3
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#121212',
              letterSpacing: '0.04em',
            }}
          >
            RADIAL TELEMETRY DISK · RING DIRECTORY HIERARCHY
          </span>
        </div>

        {/* Tactile Expansion View Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            padding: '3px',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            pointerEvents: 'auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <button
            onClick={() => setViewMode('focused')}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: viewMode === 'focused' ? 800 : 600,
              background: viewMode === 'focused' ? '#f46a1f' : 'transparent',
              color: viewMode === 'focused' ? '#ffffff' : '#525866',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            INITIAL FOCUS (..../youtube)
          </button>
          <button
            onClick={() => setViewMode('expanded')}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: viewMode === 'expanded' ? 800 : 600,
              background: viewMode === 'expanded' ? '#121212' : 'transparent',
              color: viewMode === 'expanded' ? '#ffffff' : '#525866',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            EXPANDED DISK (ALL DIRECTORIES)
          </button>
          {expandedRing && (
            <button
              onClick={() => setExpandedRing(null)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                fontWeight: 700,
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '3px 7px',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              RESET EXPANSION [RING 0{expandedRing}]
            </button>
          )}
        </div>
      </div>

      <svg
        viewBox="0 0 820 760"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '860px',
          maxHeight: '800px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <defs>
          {/* Subtle Glow Filter for Kernel Glow */}
          <filter id="kernel-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Minimal Glowy Amber Light Radial Gradient when Kernel is tapped */}
          <radialGradient id="core-glow-active" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="60%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fdba74" />
          </radialGradient>
        </defs>

        {/* ── 1. Hairline Axis Crosshairs ──────────────────────────── */}
        <line x1={cx} y1={25} x2={cx} y2={725} stroke="#e5e7eb" strokeWidth="0.8" strokeDasharray="3 4" />
        <line x1={55} y1={cy} x2={765} y2={cy} stroke="#e5e7eb" strokeWidth="0.8" strokeDasharray="3 4" />

        {/* ── 2. Concentric Gap Tracks & Circular Guides ────────────── */}
        {/* Core Outer Gap Line */}
        <circle cx={cx} cy={cy} r={r0 + 6} fill="none" stroke="#e5e7eb" strokeWidth="0.7" strokeDasharray="2 3" />

        {/* Gap 1-2 Track (between Program Files and User Space) */}
        <circle cx={cx} cy={cy} r={r1Outer} fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
        <circle cx={cx} cy={cy} r={(r1Outer + r2Inner) / 2} fill="none" stroke="#e2e8f0" strokeWidth="0.7" strokeDasharray="2 3" />
        <circle cx={cx} cy={cy} r={r2Inner} fill="none" stroke="#cbd5e1" strokeWidth="0.8" />

        {/* Gap 2-3 Track (between User Space and Outer Downloads) */}
        <circle cx={cx} cy={cy} r={r2Outer} fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
        <circle cx={cx} cy={cy} r={(r2Outer + r3Inner) / 2} fill="none" stroke="#e2e8f0" strokeWidth="0.7" strokeDasharray="2 3" />
        <circle cx={cx} cy={cy} r={r3Inner} fill="none" stroke="#cbd5e1" strokeWidth="0.8" />

        {/* Outer Perimeter */}
        <circle cx={cx} cy={cy} r={r3Outer} fill="none" stroke="#cbd5e1" strokeWidth="0.8" />

        {/* ── 3. LABELS IN THE GAPS (Explicit user request) ──────────── */}
        {/* GAP 1-2 LABEL: Ring 2 User Applications (..../youtube) */}
        <g transform={`translate(${cx}, ${cy - (r1Outer + r2Inner) / 2})`}>
          <rect
            x="-140"
            y="-8"
            width="280"
            height="16"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="0.7"
            rx="2"
          />
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fill="#121212"
            fontSize="7.5"
            fontFamily="var(--font-mono)"
            fontWeight="800"
            letterSpacing="0.08em"
          >
            RING 02 · USER APPLICATIONS · [ ..../YOUTUBE ]
          </text>
        </g>

        {/* GAP 1-2 SECONDARY LABEL (Bottom) */}
        <g transform={`translate(${cx}, ${cy + (r1Outer + r2Inner) / 2})`}>
          <rect
            x="-110"
            y="-7"
            width="220"
            height="14"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="0.7"
            rx="2"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill="#64748b"
            fontSize="7"
            fontFamily="var(--font-mono)"
            fontWeight="600"
            letterSpacing="0.05em"
          >
            TIER: C:\USERS\USER\APPDATA
          </text>
        </g>

        {/* GAP 2-3 LABEL: Ring 3 User Directories (...../apps/downloads) */}
        <g transform={`translate(${cx}, ${cy - (r2Outer + r3Inner) / 2})`}>
          <rect
            x="-155"
            y="-8"
            width="310"
            height="16"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="0.7"
            rx="2"
          />
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fill="#f46a1f"
            fontSize="7.5"
            fontFamily="var(--font-mono)"
            fontWeight="800"
            letterSpacing="0.08em"
          >
            RING 03 · USER DIRECTORIES · [ ...../APPS/DOWNLOADS ]
          </text>
        </g>

        {/* GAP 2-3 SECONDARY LABEL (Bottom) */}
        <g transform={`translate(${cx}, ${cy + (r2Outer + r3Inner) / 2})`}>
          <rect
            x="-135"
            y="-7"
            width="270"
            height="14"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="0.7"
            rx="2"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill="#64748b"
            fontSize="7"
            fontFamily="var(--font-mono)"
            fontWeight="600"
            letterSpacing="0.05em"
          >
            TIER: C:\USERS\USER (DOWNLOADS &amp; DESKTOP)
          </text>
        </g>

        {/* ── 4. Sunburst Sectors (Rendered with Hover Swell & Focus) ── */}
        {allSectors.map((sec) => {
          const isSelected =
            (selectedNode && sec.app && selectedNode.id === sec.app.id) ||
            (selectedNode && sec.perm && selectedNode.id === sec.perm.id) ||
            (selectedNode && sec.conn && selectedNode.id === sec.conn.id) ||
            (selectedNode && selectedNode.id === sec.id);

          const isHovered = hoveredItem && hoveredItem.id === sec.id;
          const isYouTubeHero = sec.id === 'sec-usr-youtube';
          const isDownloadsHero = sec.id === 'sec-out-downloads';

          // Focused mode highlighting: YouTube & Downloads are accented, others dimmed if not hovered/selected
          const isFocusedHero = (isYouTubeHero || isDownloadsHero) && viewMode === 'focused';

          // Swell / Expand on hover:
          // When hovered, outerRadius increases by 12px, innerRadius decreases slightly by 2px
          const effectiveOuter = isHovered ? sec.outerRadius + 12 : sec.outerRadius;
          const effectiveInner = isHovered ? Math.max(10, sec.innerRadius - 2) : sec.innerRadius;

          const sectorPath = describeArcSector(cx, cy, effectiveInner, effectiveOuter, sec.startAngle, sec.endAngle);

          let fillColor = '#ffffff';
          let strokeColor = '#cbd5e1';
          let strokeWidth = '1';

          if (isSelected) {
            fillColor = 'rgba(244, 106, 31, 0.22)';
            strokeColor = '#f46a1f';
            strokeWidth = '2';
          } else if (isHovered) {
            fillColor = '#f8fafc';
            strokeColor = '#121212';
            strokeWidth = '1.8';
          } else if (isFocusedHero) {
            fillColor = 'rgba(244, 106, 31, 0.10)';
            strokeColor = '#f46a1f';
            strokeWidth = '1.4';
          } else if (viewMode === 'focused' && !isFocusedHero) {
            fillColor = '#fafafa';
            strokeColor = '#e5e7eb';
          } else if (sec.risk === 'high') {
            fillColor = 'rgba(220, 38, 38, 0.05)';
            strokeColor = '#fca5a5';
          }

          // Angle arc span in degrees for conditional label density
          const arcDegrees = ((sec.endAngle - sec.startAngle) * 180) / Math.PI;

          return (
            <g
              key={sec.id}
              onClick={() => handleSectorClick(sec)}
              onMouseEnter={() => setHoveredItem(sec)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                cursor: 'pointer',
                filter: isHovered
                  ? 'drop-shadow(0 6px 14px rgba(244, 106, 31, 0.35))'
                  : 'none',
                transition: 'filter 0.15s ease',
              }}
            >
              {/* Sector Annular Wedge (Swells dynamically on hover) */}
              <path
                d={sectorPath}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                style={{
                  transition: 'd 0.16s cubic-bezier(0.16, 1, 0.3, 1), fill 0.12s ease, stroke 0.12s ease',
                }}
              />

              {/* Sector Monospace Label */}
              {arcDegrees > 14 && (
                <>
                  <text
                    x={sec.labelPos.x}
                    y={sec.labelPos.y - 3}
                    textAnchor="middle"
                    fill={isSelected || isFocusedHero ? '#f46a1f' : '#121212'}
                    fontSize={sec.ring === 3 ? '7.5' : '8'}
                    fontFamily="var(--font-mono)"
                    fontWeight={isSelected || isFocusedHero ? '800' : '700'}
                    letterSpacing="0.04em"
                    pointerEvents="none"
                  >
                    {sec.pathTag || (sec.app ? sec.app.name.toUpperCase() : sec.shortName)}
                  </text>
                  <text
                    x={sec.labelPos.x}
                    y={sec.labelPos.y + 9}
                    textAnchor="middle"
                    fill={isSelected || isFocusedHero ? '#c2410c' : '#64748b'}
                    fontSize="7"
                    fontFamily="var(--font-mono)"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {sec.sizeMB >= 1000 ? `${(sec.sizeMB / 1024).toFixed(2)} GB` : `${sec.sizeMB} MB`} ({sec.percentage}%)
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* ── 5. Center Core: Kernel Level Ring (Greyed out, glows on tap) ── */}
        <g onClick={handleCoreClick} style={{ cursor: 'pointer' }}>
          {/* Minimal Glowy Light Aura when tapped */}
          {isCoreGlowing && (
            <circle
              cx={cx}
              cy={cy}
              r={r0 + 7}
              fill="none"
              stroke="#f46a1f"
              strokeWidth="2.5"
              opacity="0.75"
              filter="url(#kernel-glow)"
              style={{
                transition: 'all 0.3s ease',
              }}
            />
          )}

          {/* Core Outer Ring: Greyed out by default (#e2e8f0), glowing orange/amber when tapped */}
          <circle
            cx={cx}
            cy={cy}
            r={r0}
            fill={isCoreGlowing ? 'url(#core-glow-active)' : '#f1f5f9'}
            stroke={isCoreGlowing ? '#f46a1f' : '#94a3b8'}
            strokeWidth={isCoreGlowing ? '2' : '1.2'}
            style={{
              transition: 'fill 0.25s ease, stroke 0.25s ease',
            }}
          />

          {/* Core Inner Circle */}
          <circle
            cx={cx}
            cy={cy}
            r={r0 - 4}
            fill={isCoreGlowing ? 'rgba(255, 255, 255, 0.9)' : '#e2e8f0'}
            stroke={isCoreGlowing ? '#f46a1f' : '#cbd5e1'}
            strokeWidth="0.8"
          />

          {/* Central Directory & Kernel Telemetry Labels */}
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            fill={isCoreGlowing ? '#121212' : '#64748b'}
            fontSize="9"
            fontFamily="var(--font-mono)"
            fontWeight="800"
            letterSpacing="0.06em"
          >
            C:\WINDOWS
          </text>
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            fill={isCoreGlowing ? '#f46a1f' : '#94a3b8'}
            fontSize="7"
            fontFamily="var(--font-mono)"
            fontWeight="700"
            letterSpacing="0.04em"
          >
            KERNEL LEVEL 0
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fill={isCoreGlowing ? '#ea580c' : '#64748b'}
            fontSize="7"
            fontFamily="var(--font-mono)"
            fontWeight="800"
          >
            {isCoreGlowing ? '● KERNEL ACTIVE' : '● GREYED / TAP GLOW'}
          </text>
        </g>
      </svg>

      {/* Floating Blueprint Telemetry Spec Strip (Bottom) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '3px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ color: '#121212', fontWeight: 800 }}>
            INSPECTED NODE:
          </span>
          <span style={{ color: '#525866' }}>
            {activeFocus?.name ? `${activeFocus.name} — ` : ''}
            <span style={{ color: '#121212', fontWeight: 600 }}>
              {activeFocus?.path || (activeFocus?.app && activeFocus.app.path) || (isCoreGlowing ? 'C:\\Windows\\System32 (Kernel Telemetry Active)' : 'Hover sector to swell | Tap core to glow | Tap sector to expand')}
            </span>
          </span>
          {activeFocus?.sizeMB && (
            <span style={{ color: '#f46a1f', fontWeight: 700 }}>
              [{activeFocus.sizeMB >= 1000 ? `${(activeFocus.sizeMB / 1024).toFixed(2)} GB` : `${activeFocus.sizeMB} MB`}]
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ color: isCoreGlowing ? '#ea580c' : '#94a3b8', fontWeight: 700 }}>
            {isCoreGlowing ? '● CORE GLOWING' : '○ CORE GREYED'}
          </span>
          <span style={{ color: '#525866' }}>RING 1: Program Files</span>
          <span style={{ color: '#525866' }}>RING 2: ..../youtube</span>
          <span style={{ color: '#f46a1f', fontWeight: 700 }}>RING 3: ...../apps/downloads</span>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';

function FlowLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="10" fill="#0D1117" stroke="#388BFD" strokeWidth="1.5" />
      <circle cx="7.5" cy="8.5" r="2" fill="#39D353" />
      <circle cx="14.5" cy="8.5" r="2" fill="#388BFD" />
      <circle cx="11" cy="15" r="2" fill="#D29922" />
      <line x1="7.5" y1="10.5" x2="11" y2="13" stroke="#388BFD" strokeWidth="1" strokeOpacity="0.7" />
      <line x1="14.5" y1="10.5" x2="11" y2="13" stroke="#388BFD" strokeWidth="1" strokeOpacity="0.7" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg height="15" width="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function MarketingNav() {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        borderBottom: '1px solid #21262D',
        background: 'rgba(8,11,17,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '56px' }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ fontWeight: 700, fontSize: '15px', color: '#E6EDF3' }}
        >
          <FlowLogo />
          Flow
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/docs"
            className="px-3 py-1.5 rounded-md text-sm font-medium hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
            style={{ color: '#8B949E' }}
          >
            Docs
          </Link>
          <a
            href="https://github.com/Sambit03/CAPSTONE"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
            style={{ color: '#8B949E' }}
          >
            <GitHubIcon />
            GitHub
          </a>
          <Link
            href="/login"
            className="ml-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all hover:border-[#388BFD] hover:text-[#388BFD]"
            style={{
              color: '#E6EDF3',
              border: '1px solid #30363D',
              background: '#161B22',
            }}
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}

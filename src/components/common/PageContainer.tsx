import React, { ReactNode, useRef, useEffect, useState } from 'react';

interface PageContainerProps {
  children: ReactNode;
  pageHeightMM: number;
  pageWidthMM: number;
  className?: string;
  layoutWrapper?: (pageContent: ReactNode, pageIndex: number) => ReactNode;
}

const MM_TO_PX = 96 / 25.4;

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  pageHeightMM,
  pageWidthMM,
  className = '',
  layoutWrapper,
}) => {
  const [pages, setPages] = useState<ReactNode[][]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const childNodes = Array.from(containerRef.current.children);
    let currentPage: ReactNode[] = [];
    let currentHeight = 0;
    const maxHeight = pageHeightMM * MM_TO_PX;
    const newPages: ReactNode[][] = [];
    const childrenArray = React.Children.toArray(children);
    let childIdx = 0;
    childNodes.forEach((child) => {
      const childHeight = (child as HTMLElement).offsetHeight;
      if (currentHeight + childHeight > maxHeight && currentPage.length > 0) {
        newPages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }
      currentPage.push(childrenArray[childIdx]);
      currentHeight += childHeight;
      childIdx++;
    });
    if (currentPage.length > 0) newPages.push(currentPage);
    setPages(newPages);
  }, [children, pageHeightMM, pageWidthMM]);

  // Hidden container for measuring
  return (
    <>
      <div
        ref={containerRef}
        style={{
          visibility: 'hidden',
          position: 'absolute',
          left: '-9999px',
          top: 0,
          zIndex: -1,
          width: `${pageWidthMM * MM_TO_PX}px`,
          pointerEvents: 'none',
        }}
      >
        {React.Children.toArray(children)}
      </div>
      {pages.map((page, i) => {
        const pageDiv = (
          <div
            key={i}
            className={className}
            style={{
              width: `${pageWidthMM}mm`,
              height: `${pageHeightMM}mm`,
              pageBreakAfter: 'always',
              overflow: 'hidden',
              position: 'relative',
              background: '#fff',
              margin: '0 auto 16px auto',
              boxSizing: 'border-box',
            }}
          >
            {page}
          </div>
        );
        return layoutWrapper ? layoutWrapper(pageDiv, i) : pageDiv;
      })}
    </>
  );
}; 
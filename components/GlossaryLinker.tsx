"use client";

import React from "react";

interface GlossaryLinkerProps {
  children: React.ReactNode;
  maxLinks?: number;
  excludeTerms?: string[];
  className?: string;
}

/**
 * Client-side component that auto-links glossary terms in text content.
 * Wraps plain text nodes and replaces glossary terms with links.
 *
 * @example
 * <GlossaryLinker>
 *   <p>The LOA and beam are key dimensions for any sailing yacht.</p>
 * </GlossaryLinker>
 */
export function GlossaryLinker({
  children,
  maxLinks = 10,
  excludeTerms = [],
  className = "",
}: GlossaryLinkerProps) {
  const [linkedContent, setLinkedContent] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    // Process children to add glossary links
    const processNode = (node: React.ReactNode): React.ReactNode => {
      if (typeof node === "string") {
        return linkGlossaryTerms(node);
      }

      if (React.isValidElement(node)) {
        const { children: nodeChildren, ...props } = node.props;

        // Skip links and interactive elements
        if (node.type === "a" || node.type === "button" || node.type === "input") {
          return node;
        }

        // Process children recursively
        const processedChildren = React.Children.toArray(nodeChildren).map(processNode);

        return React.createElement(node.type, { ...props }, ...processedChildren);
      }

      return node;
    };

    const processChildren = (nodes: React.ReactNode): React.ReactNode => {
      if (typeof nodes === "string") {
        return linkGlossaryTerms(nodes);
      }

      if (Array.isArray(nodes)) {
        return nodes.map(processNode);
      }

      if (React.isValidElement(nodes)) {
        return processNode(nodes);
      }

      return nodes;
    };

    setLinkedContent(processChildren(children));
  }, [children, maxLinks, excludeTerms]);

  const linkGlossaryTerms = (text: string): React.ReactNode => {
    if (!text) return text;

    // Glossary terms to link (client-side only, sync with lib/glossary.ts)
    const glossaryTerms = [
      { term: "LOA", slug: "loa" },
      { term: "Length Overall", slug: "loa" },
      { term: "Beam", slug: "beam" },
      { term: "Draft", slug: "draft" },
      { term: "Displacement", slug: "displacement" },
      { term: "Ballast", slug: "ballast" },
      { term: "Ballast Ratio", slug: "ballast-ratio" },
      { term: "Fin Keel", slug: "fin-keel" },
      { term: "Wing Keel", slug: "wing-keel" },
      { term: "Cutter Rig", slug: "cutter-rig" },
      { term: "Sloop Rig", slug: "sloop-rig" },
      { term: "Ketch Rig", slug: "ketch-rig" },
      { term: "Shoal Draft", slug: "shoal-draft" },
      { term: "LWL", slug: "lwl" },
      { term: "Waterline Length", slug: "lwl" },
      { term: "Hull Speed", slug: "hull-speed" },
      { term: "Cabin", slug: "cabin" },
      { term: "Berth", slug: "berth" },
      { term: "Head", slug: "head" },
      { term: "Bluewater", slug: "bluewater" },
      { term: "Coastal Cruiser", slug: "coastal-cruiser" },
      { term: "Liveaboard", slug: "liveaboard" },
    ];

    const excludeSet = new Set(excludeTerms);
    let linkedCount = 0;

    // Sort by length (longest first)
    const sortedTerms = glossaryTerms
      .filter((t) => !excludeSet.has(t.slug))
      .sort((a, b) => b.term.length - a.term.length);

    let result: React.ReactNode[] = [];
    let remainingText = text;

    for (const termInfo of sortedTerms) {
      if (linkedCount >= maxLinks) break;

      const regex = new RegExp(`\\b${termInfo.term}\\b`, "gi");
      const parts = remainingText.split(regex);

      if (parts.length > 1) {
        // Found matches
        const newResult: React.ReactNode[] = [];

        for (let i = 0; i < parts.length; i++) {
          if (i > 0 && linkedCount < maxLinks) {
            // This is a matched term
            const match = remainingText.match(regex)?.[i - 1] || termInfo.term;
            newResult.push(
              <a
                key={`link-${linkedCount}-${termInfo.slug}`}
                href={`/glossary/${termInfo.slug}`}
                className="glossary-link text-blue-600 hover:text-blue-800 underline decoration-dotted underline-offset-2"
                title={`Learn more about ${termInfo.term}`}
              >
                {match}
              </a>
            );
            linkedCount++;
          }
          newResult.push(parts[i]);
        }

        remainingText = newResult.join("");
        result = [remainingText];
      }
    }

    return result.length > 0 ? result : text;
  };

  return <span className={className}>{linkedContent ?? children}</span>;
}

export default GlossaryLinker;

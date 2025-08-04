'use client';

import { JSONContent } from '@tiptap/react';
import OptimizedImage from './OptimizedImage';
import React from 'react';

interface RichContentRendererProps {
  content: string | JSONContent;
  className?: string;
}

export function RichContentRenderer({
  content,
  className = '',
}: RichContentRendererProps) {
  let jsonContent: JSONContent;

  try {
    if (typeof content === 'string') {
      jsonContent = JSON.parse(content);
    } else {
      jsonContent = content;
    }
  } catch {
    return <div className={className}>Invalid content format</div>;
  }

  return (
    <div
      className={`prose prose-sm sm:prose-base lg:prose-lg max-w-none ${className}`}
    >
      {renderNode(jsonContent)}
    </div>
  );
}

function renderNode(node: JSONContent, key?: string | number): React.ReactNode {
  if (!node) return null;

  const nodeKey = key ?? Math.random();

  switch (node.type) {
    case 'doc':
      return (
        <div key={nodeKey}>
          {node.content?.map((child, index) => renderNode(child, index))}
        </div>
      );

    case 'paragraph':
      return (
        <p key={nodeKey} className="mb-4 leading-relaxed">
          {node.content?.map((child, index) => renderNode(child, index))}
        </p>
      );

    case 'heading':
      const level = node.attrs?.level || 1;
      const headingClasses = {
        1: 'text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 mt-6 sm:mt-8 leading-tight',
        2: 'text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 mt-5 sm:mt-6 leading-tight',
        3: 'text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 mt-4 sm:mt-5 leading-tight',
        4: 'text-base sm:text-lg lg:text-xl font-bold mb-2 mt-3 sm:mt-4 leading-tight',
        5: 'text-sm sm:text-base lg:text-lg font-bold mb-2 mt-2 sm:mt-3 leading-tight',
        6: 'text-xs sm:text-sm lg:text-base font-bold mb-2 mt-2 leading-tight',
      };

      const headingProps = {
        key: nodeKey,
        className: headingClasses[level as keyof typeof headingClasses],
        children: node.content?.map((child, index) => renderNode(child, index)),
      };

      switch (level) {
        case 1:
          return React.createElement('h1', headingProps);
        case 2:
          return React.createElement('h2', headingProps);
        case 3:
          return React.createElement('h3', headingProps);
        case 4:
          return React.createElement('h4', headingProps);
        case 5:
          return React.createElement('h5', headingProps);
        case 6:
          return React.createElement('h6', headingProps);
        default:
          return React.createElement('h1', headingProps);
      }

    case 'bulletList':
      return (
        <ul
          key={nodeKey}
          className="list-disc list-inside mb-4 space-y-1 sm:space-y-2 pl-2 sm:pl-0"
        >
          {node.content?.map((child, index) => renderNode(child, index))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol
          key={nodeKey}
          className="list-decimal list-inside mb-4 space-y-1 sm:space-y-2 pl-2 sm:pl-0"
        >
          {node.content?.map((child, index) => renderNode(child, index))}
        </ol>
      );

    case 'listItem':
      return (
        <li key={nodeKey}>
          {node.content?.map((child, index) => renderNode(child, index))}
        </li>
      );

    case 'blockquote':
      return (
        <blockquote
          key={nodeKey}
          className="border-l-4 border-gray-300 pl-3 sm:pl-4 italic mb-4 sm:mb-6 text-gray-700 -mx-2 sm:mx-0"
        >
          {node.content?.map((child, index) => renderNode(child, index))}
        </blockquote>
      );

    case 'codeBlock':
      const language = node.attrs?.language || 'plaintext';
      return (
        <div key={nodeKey} className="mb-6 -mx-4 sm:mx-0">
          <div className="bg-gray-100 rounded-t-lg px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 font-mono border-b">
            {language}
          </div>
          <pre className="bg-gray-50 rounded-b-lg p-3 sm:p-4 overflow-x-auto">
            <code className="font-mono text-xs sm:text-sm leading-relaxed">
              {node.content?.map((child, index) => renderNode(child, index))}
            </code>
          </pre>
        </div>
      );

    case 'image':
      const src = node.attrs?.src;
      const alt = node.attrs?.alt || '';
      const title = node.attrs?.title;

      if (!src) return null;

      return (
        <figure key={nodeKey} className="mb-8 -mx-4 sm:mx-0">
          <OptimizedImage
            src={src}
            alt={alt}
            className="rounded-lg shadow-sm max-w-full h-auto mx-auto block"
            width={800}
            height={600}
          />
          {(alt || title) && (
            <figcaption className="text-center text-sm text-gray-600 mt-2 px-4">
              {title || alt}
            </figcaption>
          )}
        </figure>
      );

    case 'hardBreak':
      return <br key={nodeKey} />;

    case 'text':
      const textContent = node.text || '';
      let element: React.ReactNode = textContent;

      // Apply marks (formatting)
      if (node.marks) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case 'bold':
              element = <strong key={`${nodeKey}-bold`}>{element}</strong>;
              break;
            case 'italic':
              element = <em key={`${nodeKey}-italic`}>{element}</em>;
              break;
            case 'strike':
              element = <del key={`${nodeKey}-strike`}>{element}</del>;
              break;
            case 'code':
              element = (
                <code
                  key={`${nodeKey}-code`}
                  className="bg-gray-100 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono break-words"
                >
                  {element}
                </code>
              );
              break;
            case 'link':
              const href = mark.attrs?.href;
              if (href) {
                element = (
                  <a
                    key={`${nodeKey}-link`}
                    href={href}
                    className="text-blue-600 underline hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {element}
                  </a>
                );
              }
              break;
          }
        }
      }

      return <span key={nodeKey}>{element}</span>;

    default:
      // Unknown node type, render children if available
      return (
        <div key={nodeKey}>
          {node.content?.map((child, index) => renderNode(child, index))}
        </div>
      );
  }
}

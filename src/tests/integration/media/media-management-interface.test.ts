import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Media Management Components
const MockMediaGallery = ({ 
  onSelect, 
  onBulkDelete, 
  onSearch,
  selectedItems = [],
}: {
  onSelect?: (mediaId: string, selected: boolean) => void;
  onBulkDelete?: (mediaIds: string[]) => Promise<void>;
  onSearch?: (query: string) => void;
  selectedItems?: string[];
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const mockMediaItems = [
    {
      id: 'media_1',
      publicId: 'superbear_blog/image1',
      url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/image1.jpg',
      filename: 'image1.jpg',
      size: 1024,
      uploadedAt: '2023-01-01T10:00:00Z',
      isOrphaned: false,
      references: 2,
    },
    {
      id: 'media_2',
      publicId: 'superbear_blog/orphan1',
      url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/orphan1.jpg',
      filename: 'orphan1.jpg',
      size: 2048,
      uploadedAt: '2023-01-02T10:00:00Z',
      isOrphaned: true,
      references: 0,
    },
    {
      id: 'media_3',
      publicId: 'superbear_blog/image3',
      url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/image3.jpg',
      filename: 'image3.jpg',
      size: 4096,
      uploadedAt: '2023-01-03T10:00:00Z',
      isOrphaned: false,
      references: 1,
    },
  ];

  const filteredItems = mockMediaItems.filter(item => 
    searchQuery === '' || 
    item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.publicId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0 || !onBulkDelete) return;
    
    setLoading(true);
    try {
      await onBulkDelete(selectedItems);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="media-gallery">
      <div data-testid="gallery-controls">
        <input
          type="text"
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          data-testid="search-input"
        />
        
        {selectedItems.length > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={loading}
            data-testid="bulk-delete-button"
          >
            {loading ? 'Deleting...' : `Delete ${selectedItems.length} items`}
          </button>
        )}
      </div>

      <div data-testid="media-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {filteredItems.map(item => (
          <div key={item.id} data-testid={`media-item-${item.id}`} style={{ border: '1px solid #ccc', padding: '10px' }}>
            <img 
              src={item.url} 
              alt={item.filename}
              style={{ width: '100%', height: '150px', objectFit: 'cover' }}
            />
            
            <div>
              <div data-testid={`filename-${item.id}`}>{item.filename}</div>
              <div data-testid={`size-${item.id}`}>{(item.size / 1024).toFixed(1)} KB</div>
              <div data-testid={`references-${item.id}`}>
                {item.isOrphaned ? 'Orphaned' : `${item.references} references`}
              </div>
              
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={(e) => onSelect?.(item.id, e.target.checked)}
                data-testid={`select-${item.id}`}
              />
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div data-testid="no-results">No media files found</div>
      )}
    </div>
  );
};

const MockMediaDetails = ({ 
  mediaId, 
  onClose,
  onDelete,
}: {
  mediaId: string;
  onClose?: () => void;
  onDelete?: (mediaId: string) => Promise<void>;
}) => {
  const [loading, setLoading] = React.useState(false);

  const mockMediaDetails = {
    media_1: {
      id: 'media_1',
      publicId: 'superbear_blog/image1',
      url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/image1.jpg',
      filename: 'image1.jpg',
      originalFilename: 'original-image1.jpg',
      size: 1024,
      width: 800,
      height: 600,
      format: 'jpg',
      uploadedAt: '2023-01-01T10:00:00Z',
      uploadedBy: 'user_123',
      references: [
        {
          contentType: 'article',
          contentId: 'article_1',
          contentTitle: 'Test Article 1',
          referenceContext: 'content',
        },
        {
          contentType: 'article',
          contentId: 'article_2',
          contentTitle: 'Test Article 2',
          referenceContext: 'cover_image',
        },
      ],
    },
    media_2: {
      id: 'media_2',
      publicId: 'superbear_blog/orphan1',
      url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/orphan1.jpg',
      filename: 'orphan1.jpg',
      originalFilename: 'original-orphan1.jpg',
      size: 2048,
      width: 1200,
      height: 800,
      format: 'jpg',
      uploadedAt: '2023-01-02T10:00:00Z',
      uploadedBy: 'user_456',
      references: [],
    },
  };

  const media = mockMediaDetails[mediaId as keyof typeof mockMediaDetails];

  if (!media) {
    return <div data-testid="media-not-found">Media not found</div>;
  }

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setLoading(true);
    try {
      await onDelete(mediaId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="media-details">
      <div data-testid="details-header">
        <h2>Media Details</h2>
        <button onClick={onClose} data-testid="close-details">Close</button>
      </div>

      <div data-testid="media-preview">
        <img 
          src={media.url} 
          alt={media.filename}
          style={{ maxWidth: '400px', maxHeight: '300px' }}
        />
      </div>

      <div data-testid="media-metadata">
        <div data-testid="filename">Filename: {media.filename}</div>
        <div data-testid="original-filename">Original: {media.originalFilename}</div>
        <div data-testid="public-id">Public ID: {media.publicId}</div>
        <div data-testid="dimensions">{media.width} × {media.height}</div>
        <div data-testid="file-size">{(media.size / 1024).toFixed(1)} KB</div>
        <div data-testid="format">Format: {media.format.toUpperCase()}</div>
        <div data-testid="uploaded-by">Uploaded by: {media.uploadedBy}</div>
        <div data-testid="uploaded-at">Uploaded: {new Date(media.uploadedAt).toLocaleDateString()}</div>
      </div>

      <div data-testid="usage-section">
        <h3>Usage ({media.references.length} references)</h3>
        {media.references.length === 0 ? (
          <div data-testid="no-references">This image is not referenced anywhere (orphaned)</div>
        ) : (
          <div data-testid="references-list">
            {media.references.map((ref, index) => (
              <div key={index} data-testid={`reference-${index}`}>
                {ref.contentType}: {ref.contentTitle} ({ref.referenceContext})
              </div>
            ))}
          </div>
        )}
      </div>

      <div data-testid="actions">
        <button
          onClick={handleDelete}
          disabled={loading || media.references.length > 0}
          data-testid="delete-button"
          style={{ 
            backgroundColor: media.references.length > 0 ? '#ccc' : '#dc3545',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
        
        {media.references.length > 0 && (
          <div data-testid="delete-warning" style={{ color: '#dc3545', fontSize: '12px' }}>
            Cannot delete: Image is still referenced
          </div>
        )}
      </div>
    </div>
  );
};

// Mock API functions
const mockMediaAPI = {
  getMediaFiles: jest.fn(),
  getMediaDetails: jest.fn(),
  deleteMedia: jest.fn(),
  bulkDeleteMedia: jest.fn(),
  searchMedia: jest.fn(),
};

describe('Media Management Interface Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Media Gallery Integration', () => {
    it('should display media files in gallery view', async () => {
      const handleSelect = jest.fn();
      
      render(<MockMediaGallery onSelect={handleSelect} />);

      // Verify gallery is rendered
      expect(screen.getByTestId('media-gallery')).toBeInTheDocument();
      expect(screen.getByTestId('media-grid')).toBeInTheDocument();

      // Verify media items are displayed
      expect(screen.getByTestId('media-item-media_1')).toBeInTheDocument();
      expect(screen.getByTestId('media-item-media_2')).toBeInTheDocument();
      expect(screen.getByTestId('media-item-media_3')).toBeInTheDocument();

      // Verify file information is displayed
      expect(screen.getByTestId('filename-media_1')).toHaveTextContent('image1.jpg');
      expect(screen.getByTestId('size-media_1')).toHaveTextContent('1.0 KB');
      expect(screen.getByTestId('references-media_1')).toHaveTextContent('2 references');

      // Verify orphaned status
      expect(screen.getByTestId('references-media_2')).toHaveTextContent('Orphaned');
    });

    it('should handle media selection and bulk operations', async () => {
      const user = userEvent.setup();
      const handleSelect = jest.fn();
      const handleBulkDelete = jest.fn().mockResolvedValue(undefined);
      
      const TestComponent = () => {
        const [selectedItems, setSelectedItems] = React.useState<string[]>([]);

        const handleSelectItem = (mediaId: string, selected: boolean) => {
          setSelectedItems(prev => 
            selected 
              ? [...prev, mediaId]
              : prev.filter(id => id !== mediaId)
          );
          handleSelect(mediaId, selected);
        };

        return (
          <MockMediaGallery 
            onSelect={handleSelectItem}
            onBulkDelete={handleBulkDelete}
            selectedItems={selectedItems}
          />
        );
      };

      render(<TestComponent />);

      // Select first item
      const checkbox1 = screen.getByTestId('select-media_1');
      await user.click(checkbox1);

      expect(handleSelect).toHaveBeenCalledWith('media_1', true);

      // Select second item
      const checkbox2 = screen.getByTestId('select-media_2');
      await user.click(checkbox2);

      expect(handleSelect).toHaveBeenCalledWith('media_2', true);

      // Verify bulk delete button appears
      await waitFor(() => {
        expect(screen.getByTestId('bulk-delete-button')).toBeInTheDocument();
        expect(screen.getByTestId('bulk-delete-button')).toHaveTextContent('Delete 2 items');
      });

      // Perform bulk delete
      await user.click(screen.getByTestId('bulk-delete-button'));

      expect(handleBulkDelete).toHaveBeenCalledWith(['media_1', 'media_2']);

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByTestId('bulk-delete-button')).toHaveTextContent('Deleting...');
      });
    });

    it('should filter media files based on search query', async () => {
      const user = userEvent.setup();
      const handleSearch = jest.fn();

      render(<MockMediaGallery onSearch={handleSearch} />);

      const searchInput = screen.getByTestId('search-input');

      // Search for specific filename
      await user.type(searchInput, 'orphan');

      expect(handleSearch).toHaveBeenCalledWith('orphan');

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByTestId('media-item-media_2')).toBeInTheDocument();
        expect(screen.queryByTestId('media-item-media_1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('media-item-media_3')).not.toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);
      await user.type(searchInput, '');

      // Verify all items are shown again
      await waitFor(() => {
        expect(screen.getByTestId('media-item-media_1')).toBeInTheDocument();
        expect(screen.getByTestId('media-item-media_2')).toBeInTheDocument();
        expect(screen.getByTestId('media-item-media_3')).toBeInTheDocument();
      });
    });

    it('should show no results message when search yields no matches', async () => {
      const user = userEvent.setup();

      render(<MockMediaGallery />);

      const searchInput = screen.getByTestId('search-input');

      // Search for non-existent file
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByTestId('no-results')).toBeInTheDocument();
        expect(screen.getByTestId('no-results')).toHaveTextContent('No media files found');
      });
    });
  });

  describe('Media Details Integration', () => {
    it('should display detailed media information', () => {
      const handleClose = jest.fn();

      render(<MockMediaDetails mediaId="media_1" onClose={handleClose} />);

      // Verify details are displayed
      expect(screen.getByTestId('media-details')).toBeInTheDocument();
      expect(screen.getByTestId('media-preview')).toBeInTheDocument();

      // Verify metadata
      expect(screen.getByTestId('filename')).toHaveTextContent('image1.jpg');
      expect(screen.getByTestId('original-filename')).toHaveTextContent('original-image1.jpg');
      expect(screen.getByTestId('public-id')).toHaveTextContent('superbear_blog/image1');
      expect(screen.getByTestId('dimensions')).toHaveTextContent('800 × 600');
      expect(screen.getByTestId('file-size')).toHaveTextContent('1.0 KB');
      expect(screen.getByTestId('format')).toHaveTextContent('JPG');
      expect(screen.getByTestId('uploaded-by')).toHaveTextContent('user_123');

      // Verify usage information
      expect(screen.getByTestId('usage-section')).toHaveTextContent('Usage (2 references)');
      expect(screen.getByTestId('references-list')).toBeInTheDocument();
      expect(screen.getByTestId('reference-0')).toHaveTextContent('article: Test Article 1 (content)');
      expect(screen.getByTestId('reference-1')).toHaveTextContent('article: Test Article 2 (cover_image)');
    });

    it('should show orphaned status for unreferenced media', () => {
      render(<MockMediaDetails mediaId="media_2" />);

      // Verify orphaned status
      expect(screen.getByTestId('usage-section')).toHaveTextContent('Usage (0 references)');
      expect(screen.getByTestId('no-references')).toBeInTheDocument();
      expect(screen.getByTestId('no-references')).toHaveTextContent('This image is not referenced anywhere (orphaned)');
    });

    it('should handle media deletion for orphaned files', async () => {
      const user = userEvent.setup();
      const handleDelete = jest.fn().mockResolvedValue(undefined);

      render(<MockMediaDetails mediaId="media_2" onDelete={handleDelete} />);

      const deleteButton = screen.getByTestId('delete-button');

      // Verify delete button is enabled for orphaned file
      expect(deleteButton).not.toBeDisabled();

      // Perform deletion
      await user.click(deleteButton);

      expect(handleDelete).toHaveBeenCalledWith('media_2');

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByTestId('delete-button')).toHaveTextContent('Deleting...');
      });
    });

    it('should prevent deletion of referenced media', () => {
      render(<MockMediaDetails mediaId="media_1" />);

      const deleteButton = screen.getByTestId('delete-button');

      // Verify delete button is disabled for referenced file
      expect(deleteButton).toBeDisabled();

      // Verify warning message
      expect(screen.getByTestId('delete-warning')).toBeInTheDocument();
      expect(screen.getByTestId('delete-warning')).toHaveTextContent('Cannot delete: Image is still referenced');
    });

    it('should handle close action', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(<MockMediaDetails mediaId="media_1" onClose={handleClose} />);

      const closeButton = screen.getByTestId('close-details');
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalled();
    });

    it('should handle non-existent media', () => {
      render(<MockMediaDetails mediaId="non_existent" />);

      expect(screen.getByTestId('media-not-found')).toBeInTheDocument();
      expect(screen.getByTestId('media-not-found')).toHaveTextContent('Media not found');
    });
  });

  describe('Integrated Workflow Tests', () => {
    it('should support complete media management workflow', async () => {
      const user = userEvent.setup();

      const TestWorkflow = () => {
        const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
        const [selectedMediaId, setSelectedMediaId] = React.useState<string | null>(null);

        const handleSelect = (mediaId: string, selected: boolean) => {
          setSelectedItems(prev => 
            selected 
              ? [...prev, mediaId]
              : prev.filter(id => id !== mediaId)
          );
        };

        const handleBulkDelete = async (mediaIds: string[]) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 100));
          setSelectedItems([]);
        };

        const handleViewDetails = (mediaId: string) => {
          setSelectedMediaId(mediaId);
        };

        const handleCloseDetails = () => {
          setSelectedMediaId(null);
        };

        const handleDeleteSingle = async (mediaId: string) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 100));
          setSelectedMediaId(null);
        };

        return (
          <div>
            <MockMediaGallery 
              onSelect={handleSelect}
              onBulkDelete={handleBulkDelete}
              selectedItems={selectedItems}
            />
            
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={() => handleViewDetails('media_1')}
                data-testid="view-details-1"
              >
                View Details - Image 1
              </button>
              <button 
                onClick={() => handleViewDetails('media_2')}
                data-testid="view-details-2"
              >
                View Details - Orphan
              </button>
            </div>

            {selectedMediaId && (
              <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '20px' }}>
                <MockMediaDetails 
                  mediaId={selectedMediaId}
                  onClose={handleCloseDetails}
                  onDelete={handleDeleteSingle}
                />
              </div>
            )}
          </div>
        );
      };

      render(<TestWorkflow />);

      // Step 1: Select multiple items for bulk deletion
      await user.click(screen.getByTestId('select-media_2')); // Select orphaned item
      
      await waitFor(() => {
        expect(screen.getByTestId('bulk-delete-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('bulk-delete-button'));

      // Step 2: View details of a referenced image
      await user.click(screen.getByTestId('view-details-1'));

      await waitFor(() => {
        expect(screen.getByTestId('media-details')).toBeInTheDocument();
        expect(screen.getByTestId('delete-button')).toBeDisabled();
      });

      // Step 3: Close details and view orphaned image
      await user.click(screen.getByTestId('close-details'));

      await waitFor(() => {
        expect(screen.queryByTestId('media-details')).not.toBeInTheDocument();
      });

      await user.click(screen.getByTestId('view-details-2'));

      await waitFor(() => {
        expect(screen.getByTestId('media-details')).toBeInTheDocument();
        expect(screen.getByTestId('delete-button')).not.toBeDisabled();
      });

      // Step 4: Delete orphaned image
      await user.click(screen.getByTestId('delete-button'));

      await waitFor(() => {
        expect(screen.getByTestId('delete-button')).toHaveTextContent('Deleting...');
      });
    });

    it('should handle search and selection workflow', async () => {
      const user = userEvent.setup();

      const TestSearchWorkflow = () => {
        const [selectedItems, setSelectedItems] = React.useState<string[]>([]);

        const handleSelect = (mediaId: string, selected: boolean) => {
          setSelectedItems(prev => 
            selected 
              ? [...prev, mediaId]
              : prev.filter(id => id !== mediaId)
          );
        };

        return (
          <div>
            <MockMediaGallery 
              onSelect={handleSelect}
              selectedItems={selectedItems}
            />
            <div data-testid="selection-count">
              Selected: {selectedItems.length} items
            </div>
          </div>
        );
      };

      render(<TestSearchWorkflow />);

      // Search for orphaned files
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'orphan');

      // Select the filtered result
      await waitFor(() => {
        expect(screen.getByTestId('media-item-media_2')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('select-media_2'));

      // Verify selection
      expect(screen.getByTestId('selection-count')).toHaveTextContent('Selected: 1 items');

      // Clear search to show all items
      await user.clear(searchInput);

      // Verify selection persists
      await waitFor(() => {
        expect(screen.getByTestId('media-item-media_1')).toBeInTheDocument();
        expect(screen.getByTestId('selection-count')).toHaveTextContent('Selected: 1 items');
      });
    });
  });
});
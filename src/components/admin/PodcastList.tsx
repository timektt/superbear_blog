'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/hooks/useToast';

interface PodcastListProps {
  podcasts: any[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onRefresh: () => void;
}

export function PodcastList({ podcasts, onEdit, onDelete, onStatusChange, onRefresh }: PodcastListProps) {
  const { toast } = useToast();
  const [selectedPodcasts, setSelectedPodcasts] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesStatus = !filterStatus || podcast.status === filterStatus;
    const matchesCategory = !filterCategory || podcast.category?.id === filterCategory;
    const matchesSearch = !searchQuery || 
      podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedPodcasts.length === filteredPodcasts.length) {
      setSelectedPodcasts([]);
    } else {
      setSelectedPodcasts(filteredPodcasts.map(p => p.id));
    }
  };

  const handleSelectPodcast = (podcastId: string) => {
    setSelectedPodcasts(prev => 
      prev.includes(podcastId)
        ? prev.filter(id => id !== podcastId)
        : [...prev, podcastId]
    );
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedPodcasts.length === 0) {
      toast({ title: 'No podcasts selected', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedPodcasts.map(id => onStatusChange(id, status))
      );
      setSelectedPodcasts([]);
      toast({ title: `Updated ${selectedPodcasts.length} podcast(s)` });
      onRefresh();
    } catch (error) {
      toast({ title: 'Failed to update podcasts', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPodcasts.length === 0) {
      toast({ title: 'No podcasts selected', variant: 'destructive' });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPodcasts.length} podcast(s)?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedPodcasts.map(id => onDelete(id))
      );
      setSelectedPodcasts([]);
      toast({ title: `Deleted ${selectedPodcasts.length} podcast(s)` });
      onRefresh();
    } catch (error) {
      toast({ title: 'Failed to delete podcasts', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = Array.from(new Set(podcasts.map(p => p.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Podcast Episodes</h1>
          <p className="text-gray-600">Manage your podcast episodes</p>
        </div>
        <Link href="/admin/podcasts/new">
          <Button>Create New Episode</Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <option value="">All Categories</option>
            {categories.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedPodcasts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedPodcasts.length} podcast(s) selected
            </span>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('PUBLISHED')}
                disabled={isLoading}
              >
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('DRAFT')}
                disabled={isLoading}
              >
                Draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('ARCHIVED')}
                disabled={isLoading}
              >
                Archive
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isLoading}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Podcast List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={selectedPodcasts.length === filteredPodcasts.length && filteredPodcasts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-4">Episode</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Duration</th>
                <th className="text-left p-4">Published</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPodcasts.map((podcast) => (
                <tr key={podcast.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedPodcasts.includes(podcast.id)}
                      onChange={() => handleSelectPodcast(podcast.id)}
                      className="rounded"
                    />
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {podcast.coverImage && (
                        <img
                          src={podcast.coverImage}
                          alt={podcast.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{podcast.title}</h3>
                        <p className="text-sm text-gray-600">
                          {podcast.episodeNumber && `Episode ${podcast.episodeNumber}`}
                          {podcast.seasonNumber && ` • Season ${podcast.seasonNumber}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          by {podcast.author?.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <Badge className={getStatusColor(podcast.status)}>
                      {podcast.status}
                    </Badge>
                  </td>
                  
                  <td className="p-4">
                    {podcast.category ? (
                      <Badge variant="outline">{podcast.category.name}</Badge>
                    ) : (
                      <span className="text-gray-400">No category</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <span className="text-sm">{formatDuration(podcast.duration)}</span>
                  </td>
                  
                  <td className="p-4">
                    <span className="text-sm">
                      {podcast.publishedAt 
                        ? new Date(podcast.publishedAt).toLocaleDateString()
                        : 'Not published'
                      }
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(podcast.id)}
                      >
                        Edit
                      </Button>
                      
                      <Select
                        value={podcast.status}
                        onValueChange={(status) => onStatusChange(podcast.id, status)}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </Select>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this podcast?')) {
                            onDelete(podcast.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPodcasts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No podcasts found</p>
              {(filterStatus || filterCategory || searchQuery) && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setFilterStatus('');
                    setFilterCategory('');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
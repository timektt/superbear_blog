'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/hooks/useToast';

interface NewsletterIssueListProps {
  issues: any[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onSend: (id: string) => void;
  onRefresh: () => void;
}

export function NewsletterIssueList({ 
  issues, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onSend, 
  onRefresh 
}: NewsletterIssueListProps) {
  const { toast } = useToast();
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = !filterStatus || issue.status === filterStatus;
    const matchesSearch = !searchQuery || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedIssues.length === filteredIssues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(filteredIssues.map(i => i.id));
    }
  };

  const handleSelectIssue = (issueId: string) => {
    setSelectedIssues(prev => 
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedIssues.length === 0) {
      toast({ title: 'No issues selected', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedIssues.map(id => onStatusChange(id, status))
      );
      setSelectedIssues([]);
      toast({ title: `Updated ${selectedIssues.length} issue(s)` });
      onRefresh();
    } catch (error) {
      toast({ title: 'Failed to update issues', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIssues.length === 0) {
      toast({ title: 'No issues selected', variant: 'destructive' });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIssues.length} issue(s)?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedIssues.map(id => onDelete(id))
      );
      setSelectedIssues([]);
      toast({ title: `Deleted ${selectedIssues.length} issue(s)` });
      onRefresh();
    } catch (error) {
      toast({ title: 'Failed to delete issues', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSend = async () => {
    const publishedIssues = selectedIssues.filter(id => {
      const issue = issues.find(i => i.id === id);
      return issue?.status === 'PUBLISHED' && !issue?.sentAt;
    });

    if (publishedIssues.length === 0) {
      toast({ title: 'No published, unsent issues selected', variant: 'destructive' });
      return;
    }

    if (!confirm(`Are you sure you want to send ${publishedIssues.length} newsletter(s) to all subscribers?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        publishedIssues.map(id => onSend(id))
      );
      setSelectedIssues([]);
      toast({ title: `Sent ${publishedIssues.length} newsletter(s)` });
      onRefresh();
    } catch (error) {
      toast({ title: 'Failed to send newsletters', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentStatusBadge = (issue: any) => {
    if (issue.sentAt) {
      return <Badge className="bg-blue-100 text-blue-800">Sent</Badge>;
    }
    if (issue.status === 'PUBLISHED') {
      return <Badge className="bg-orange-100 text-orange-800">Ready to Send</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletter Issues</h1>
          <p className="text-gray-600">Manage your newsletter issues and campaigns</p>
        </div>
        <Link href="/admin/newsletter/new">
          <Button>Create New Issue</Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search newsletter issues..."
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

          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedIssues.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedIssues.length} issue(s) selected
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
                variant="default"
                size="sm"
                onClick={handleBulkSend}
                disabled={isLoading}
              >
                Send Selected
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

      {/* Newsletter Issues List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={selectedIssues.length === filteredIssues.length && filteredIssues.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-4">Issue</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Published</th>
                <th className="text-left p-4">Sent</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => (
                <tr key={issue.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIssues.includes(issue.id)}
                      onChange={() => handleSelectIssue(issue.id)}
                      className="rounded"
                    />
                  </td>
                  
                  <td className="p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{issue.title}</h3>
                        <Badge variant="outline">#{issue.issueNumber}</Badge>
                      </div>
                      {issue.summary && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {issue.summary}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        by {issue.author?.name}
                      </p>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status}
                      </Badge>
                      {getSentStatusBadge(issue)}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className="text-sm">
                      {issue.publishedAt 
                        ? new Date(issue.publishedAt).toLocaleDateString()
                        : 'Not published'
                      }
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <span className="text-sm">
                      {issue.sentAt 
                        ? new Date(issue.sentAt).toLocaleDateString()
                        : 'Not sent'
                      }
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(issue.id)}
                      >
                        Edit
                      </Button>
                      
                      {issue.status === 'PUBLISHED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/newsletter/${issue.slug}`, '_blank')}
                        >
                          Preview
                        </Button>
                      )}
                      
                      {issue.status === 'PUBLISHED' && !issue.sentAt && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to send this newsletter to all subscribers?')) {
                              onSend(issue.id);
                            }
                          }}
                        >
                          Send
                        </Button>
                      )}
                      
                      <Select
                        value={issue.status}
                        onValueChange={(status) => onStatusChange(issue.id, status)}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </Select>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this newsletter issue?')) {
                            onDelete(issue.id);
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
          
          {filteredIssues.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No newsletter issues found</p>
              {(filterStatus || searchQuery) && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setFilterStatus('');
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
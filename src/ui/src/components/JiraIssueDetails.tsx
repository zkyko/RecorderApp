import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  Alert,
  Loader,
  Textarea,
  Select,
  Tabs,
  Divider,
  Paper,
  Modal,
  TextInput,
} from '@mantine/core';
import { Bug, ArrowLeft, ExternalLink, MessageSquare, Edit, Check, X, RefreshCw } from 'lucide-react';
import { ipc } from '../ipc';
import { notifications } from '@mantine/notifications';

const JiraIssueDetails: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [transitions, setTransitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  
  // Comment
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  
  // Transition
  const [transitionModalOpened, setTransitionModalOpened] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<string>('');
  const [transitionComment, setTransitionComment] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (issueKey) {
      loadIssue();
      loadComments();
      loadTransitions();
    }
  }, [issueKey]);

  const loadIssue = async () => {
    if (!issueKey) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.jira.getIssue(issueKey);
      if (result.success && result.issue) {
        setIssue(result.issue);
        setEditSummary(result.issue.summary);
        setEditDescription(result.issue.description || '');
        setEditPriority(result.issue.priority || '');
      } else {
        setError(result.error || 'Failed to load issue');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!issueKey) return;
    
    try {
      const result = await ipc.jira.getComments(issueKey);
      if (result.success && result.comments) {
        setComments(result.comments);
      }
    } catch (err: any) {
      console.error('Failed to load comments:', err);
    }
  };

  const loadTransitions = async () => {
    if (!issueKey) return;
    
    try {
      const result = await ipc.jira.getTransitions(issueKey);
      if (result.success && result.transitions) {
        setTransitions(result.transitions);
      }
    } catch (err: any) {
      console.error('Failed to load transitions:', err);
    }
  };

  const handleSave = async () => {
    if (!issueKey) return;
    
    setLoading(true);
    try {
      const updates: any = {};
      if (editSummary !== issue.summary) {
        updates.summary = editSummary;
      }
      if (editDescription !== (issue.description || '')) {
        updates.description = editDescription;
      }
      if (editPriority && editPriority !== issue.priority) {
        updates.priority = editPriority;
      }
      
      const result = await ipc.jira.updateIssue({ issueKey, updates });
      if (result.success) {
        notifications.show({
          title: 'Success',
          message: 'Issue updated successfully',
          color: 'green',
        });
        setIsEditing(false);
        await loadIssue();
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'Failed to update issue',
          color: 'red',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to update issue',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!issueKey || !newComment.trim()) return;
    
    setAddingComment(true);
    try {
      const result = await ipc.jira.addComment({ issueKey, comment: newComment });
      if (result.success) {
        notifications.show({
          title: 'Success',
          message: 'Comment added successfully',
          color: 'green',
        });
        setNewComment('');
        await loadComments();
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'Failed to add comment',
          color: 'red',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to add comment',
        color: 'red',
      });
    } finally {
      setAddingComment(false);
    }
  };

  const handleTransition = async () => {
    if (!issueKey || !selectedTransition) return;
    
    setTransitioning(true);
    try {
      const result = await ipc.jira.transitionIssue({
        issueKey,
        transitionId: selectedTransition,
        comment: transitionComment || undefined,
      });
      if (result.success) {
        notifications.show({
          title: 'Success',
          message: 'Issue transitioned successfully',
          color: 'green',
        });
        setTransitionModalOpened(false);
        setSelectedTransition('');
        setTransitionComment('');
        await loadIssue();
        await loadTransitions();
      } else {
        notifications.show({
          title: 'Error',
          message: result.error || 'Failed to transition issue',
          color: 'red',
        });
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to transition issue',
        color: 'red',
      });
    } finally {
      setTransitioning(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('done') || lowerStatus.includes('resolved') || lowerStatus.includes('closed')) {
      return 'green';
    }
    if (lowerStatus.includes('in progress') || lowerStatus.includes('testing')) {
      return 'blue';
    }
    if (lowerStatus.includes('to do') || lowerStatus.includes('open')) {
      return 'gray';
    }
    if (lowerStatus.includes('blocked') || lowerStatus.includes('rejected')) {
      return 'red';
    }
    return 'yellow';
  };

  if (loading && !issue) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader size="lg" />
      </div>
    );
  }

  if (error && !issue) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert color="red" icon={<Bug size={16} />}>
          {error}
        </Alert>
        <Button mt="md" onClick={() => navigate('/jira/issues')}>
          Back to Issues
        </Button>
      </div>
    );
  }

  if (!issue) {
    return null;
  }

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      <Stack gap="md">
        {/* Header */}
        <Card>
          <Group justify="space-between" align="flex-start">
            <Group>
              <Button
                variant="subtle"
                leftSection={<ArrowLeft size={16} />}
                onClick={() => navigate('/jira/issues')}
              >
                Back
              </Button>
              <div>
                <Group gap="xs" mb="xs">
                  <Text fw={700} size="xl">
                    {issue.key}
                  </Text>
                  <Badge color={getStatusColor(issue.status)}>{issue.status}</Badge>
                  <Badge color="gray">{issue.issueType}</Badge>
                </Group>
                {isEditing ? (
                  <TextInput
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    style={{ maxWidth: 600 }}
                  />
                ) : (
                  <Text fw={500} size="lg">
                    {issue.summary}
                  </Text>
                )}
              </div>
            </Group>
            <Group>
              {isEditing ? (
                <>
                  <Button
                    leftSection={<Check size={16} />}
                    onClick={handleSave}
                    loading={loading}
                  >
                    Save
                  </Button>
                  <Button
                    variant="subtle"
                    leftSection={<X size={16} />}
                    onClick={() => {
                      setIsEditing(false);
                      setEditSummary(issue.summary);
                      setEditDescription(issue.description || '');
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {transitions.length > 0 && (
                    <Button
                      variant="light"
                      onClick={() => setTransitionModalOpened(true)}
                    >
                      Change Status
                    </Button>
                  )}
                  <Button
                    variant="light"
                    leftSection={<Edit size={16} />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<RefreshCw size={16} />}
                    onClick={loadIssue}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<ExternalLink size={16} />}
                    onClick={() => window.open(issue.url, '_blank')}
                  >
                    Open in Jira
                  </Button>
                </>
              )}
            </Group>
          </Group>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'details')}>
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="comments">Comments ({comments.length})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Card>
              <Stack gap="md">
                <div>
                  <Text size="sm" fw={500} mb={4}>Description</Text>
                  {isEditing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      minRows={6}
                      autosize
                    />
                  ) : (
                    <Paper p="md" withBorder>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {issue.description || 'No description provided'}
                      </Text>
                    </Paper>
                  )}
                </div>

                <Divider />

                <Group grow>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Assignee</Text>
                    <Text size="sm" c="dimmed">{issue.assignee || 'Unassigned'}</Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Reporter</Text>
                    <Text size="sm" c="dimmed">{issue.reporter || 'Unknown'}</Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Priority</Text>
                    {isEditing ? (
                      <Select
                        value={editPriority}
                        onChange={(value) => setEditPriority(value || '')}
                        data={['Highest', 'High', 'Medium', 'Low', 'Lowest']}
                      />
                    ) : (
                      <Text size="sm" c="dimmed">{issue.priority || 'None'}</Text>
                    )}
                  </div>
                </Group>

                <Divider />

                <Group grow>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Created</Text>
                    <Text size="sm" c="dimmed">{formatDate(issue.created)}</Text>
                  </div>
                  <div>
                    <Text size="sm" fw={500} mb={4}>Updated</Text>
                    <Text size="sm" c="dimmed">{formatDate(issue.updated)}</Text>
                  </div>
                </Group>

                {issue.labels && issue.labels.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <Text size="sm" fw={500} mb={4}>Labels</Text>
                      <Group gap="xs">
                        {issue.labels.map((label: string) => (
                          <Badge key={label} variant="light">
                            {label}
                          </Badge>
                        ))}
                      </Group>
                    </div>
                  </>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="comments" pt="md">
            <Stack gap="md">
              {/* Add Comment */}
              <Card>
                <Stack gap="md">
                  <Text fw={500}>Add Comment</Text>
                  <Textarea
                    placeholder="Enter your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    minRows={4}
                    autosize
                  />
                  <Group justify="flex-end">
                    <Button
                      onClick={handleAddComment}
                      loading={addingComment}
                      disabled={!newComment.trim()}
                      leftSection={<MessageSquare size={16} />}
                    >
                      Add Comment
                    </Button>
                  </Group>
                </Stack>
              </Card>

              {/* Comments List */}
              {comments.length === 0 ? (
                <Card>
                  <Text c="dimmed" ta="center">No comments yet</Text>
                </Card>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text fw={500} size="sm">{comment.author}</Text>
                        <Text size="xs" c="dimmed">{formatDate(comment.created)}</Text>
                      </Group>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {comment.body}
                      </Text>
                    </Stack>
                  </Card>
                ))
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Transition Modal */}
      <Modal
        opened={transitionModalOpened}
        onClose={() => {
          setTransitionModalOpened(false);
          setSelectedTransition('');
          setTransitionComment('');
        }}
        title="Change Issue Status"
      >
        <Stack gap="md">
          <Select
            label="New Status"
            placeholder="Select a status"
            value={selectedTransition}
            onChange={(value) => setSelectedTransition(value || '')}
            data={transitions.map((t) => ({
              value: t.id,
              label: `${t.name} → ${t.to.name}`,
            }))}
            required
          />
          <Textarea
            label="Comment (optional)"
            placeholder="Add a comment about this status change..."
            value={transitionComment}
            onChange={(e) => setTransitionComment(e.target.value)}
            minRows={3}
            autosize
          />
          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                setTransitionModalOpened(false);
                setSelectedTransition('');
                setTransitionComment('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransition}
              loading={transitioning}
              disabled={!selectedTransition}
            >
              Transition
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default JiraIssueDetails;


import React from 'react';
import { Card, Grid, Text, Group, Button, Badge, Stack, Divider } from '@mantine/core';
import { 
  ExternalLink, 
  Check, 
  Zap,
  Cloud,
  Code,
  Database,
  Globe,
  Download
} from 'lucide-react';
import './MarketplaceScreen.css';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'available' | 'coming-soon' | 'beta';
  icon: React.ReactNode;
  features: string[];
  link?: string;
}

const integrations: Integration[] = [
  {
    id: 'jira',
    name: 'JIRA Integration',
    description: 'Sync test results, create tickets, and track defects directly from QA Studio.',
    category: 'Issue Tracking',
    status: 'available',
    icon: <ExternalLink size={24} />,
    features: [
      'Auto-create JIRA tickets for failed tests',
      'Sync test run status to JIRA',
      'Link test cases to JIRA stories',
      'Real-time defect tracking'
    ],
    link: '/download'
  },
  {
    id: 'browserstack',
    name: 'BrowserStack Integration',
    description: 'Run tests on 3000+ real devices and browsers in the cloud.',
    category: 'Cloud Testing',
    status: 'available',
    icon: <Cloud size={24} />,
    features: [
      '3000+ real devices and browsers',
      'Parallel test execution',
      'Automated screenshots and videos',
      'Network throttling and geolocation'
    ],
    link: '/download'
  },
  {
    id: 'salesforce',
    name: 'Salesforce Recorder',
    description: 'Record and automate Salesforce workflows with intelligent locator detection.',
    category: 'CRM',
    status: 'coming-soon',
    icon: <Database size={24} />,
    features: [
      'Salesforce-specific locators',
      'Lightning and Classic UI support',
      'Automated workflow recording',
      'Salesforce API integration'
    ]
  },
  {
    id: 'koerber-wms',
    name: 'Körber WMS Support',
    description: 'Native support for Körber Warehouse Management System automation.',
    category: 'WMS',
    status: 'coming-soon',
    icon: <Zap size={24} />,
    features: [
      'Körber WMS-specific components',
      'Warehouse operation automation',
      'Inventory management workflows',
      'RF device simulation'
    ]
  },
  {
    id: 'd365-deep',
    name: 'D365 Deep Integration',
    description: 'Advanced Dynamics 365 integration with form state management and business logic.',
    category: 'ERP',
    status: 'beta',
    icon: <Globe size={24} />,
    features: [
      'Form state detection',
      'Business rule validation',
      'Workflow automation',
      'Data entity integration'
    ],
    link: '/download'
  },
  {
    id: 'custom-api',
    name: 'Custom API Integration',
    description: 'Build custom integrations with REST APIs, webhooks, and third-party services.',
    category: 'Development',
    status: 'coming-soon',
    icon: <Code size={24} />,
    features: [
      'REST API connector',
      'Webhook support',
      'Custom authentication',
      'Data transformation pipelines'
    ]
  }
];

const MarketplaceScreen: React.FC = () => {
  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'available':
        return <Badge color="green" leftSection={<Check size={12} />}>Available</Badge>;
      case 'beta':
        return <Badge color="blue">Beta</Badge>;
      case 'coming-soon':
        return <Badge color="gray">Coming Soon</Badge>;
    }
  };

  return (
    <div className="marketplace-screen">
      <div style={{ marginBottom: '2rem' }}>
        <Text size="xl" fw={700} mb="xs">Marketplace</Text>
        <Text size="sm" c="dimmed">
          Extend QA Studio with powerful integrations and connectors
        </Text>
      </div>

      <Grid gutter="md">
        {integrations.map((integration) => (
          <Grid.Col key={integration.id} span={{ base: 12, sm: 6, lg: 4 }}>
            <Card 
              padding="lg" 
              radius="md" 
              withBorder
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <Stack gap="md" style={{ flex: 1 }}>
                <Group justify="space-between" align="flex-start">
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6'
                  }}>
                    {integration.icon}
                  </div>
                  {getStatusBadge(integration.status)}
                </Group>

                <div>
                  <Text fw={600} size="lg" mb={4}>{integration.name}</Text>
                  <Text size="xs" c="dimmed" mb="xs">{integration.category}</Text>
                  <Text size="sm" c="dimmed">{integration.description}</Text>
                </div>

                <Divider />

                <div style={{ flex: 1 }}>
                  <Text size="xs" fw={600} mb="xs" c="dimmed">Features:</Text>
                  <Stack gap={4}>
                    {integration.features.map((feature, idx) => (
                      <Group key={idx} gap={8}>
                        <Check size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                        <Text size="xs" c="dimmed">{feature}</Text>
                      </Group>
                    ))}
                  </Stack>
                </div>

                {integration.status === 'available' && integration.link && (
                  <Button
                    component="a"
                    href={integration.link}
                    fullWidth
                    variant="filled"
                    leftSection={<Download size={16} />}
                  >
                    Get Started
                  </Button>
                )}
                {integration.status === 'beta' && integration.link && (
                  <Button
                    component="a"
                    href={integration.link}
                    fullWidth
                    variant="light"
                    leftSection={<Zap size={16} />}
                  >
                    Try Beta
                  </Button>
                )}
                {integration.status === 'coming-soon' && (
                  <Button
                    fullWidth
                    variant="subtle"
                    disabled
                  >
                    Coming Soon
                  </Button>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </div>
  );
};

export default MarketplaceScreen;


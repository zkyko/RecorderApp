'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Text, Group, Stack, Progress, Stepper } from '@mantine/core';
import { Play, Pause, SkipForward, X, ArrowRight, ArrowLeft } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  route: string;
  highlight?: string; // CSS selector to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Welcome to QA Studio',
    description: 'This is your dashboard. Here you can see an overview of your tests, recent runs, and quick actions.',
    route: '/',
  },
  {
    id: 'test-library',
    title: 'Test Library',
    description: 'Browse and manage all your test cases. You can filter by module, status, or search for specific tests.',
    route: '/library',
  },
  {
    id: 'record',
    title: 'Record Tests',
    description: 'Use the recorder to capture user interactions and automatically generate test code. Just click through your application!',
    route: '/record',
  },
  {
    id: 'runs',
    title: 'Test Runs',
    description: 'View execution history, see which tests passed or failed, and analyze results with detailed logs and traces.',
    route: '/runs',
  },
  {
    id: 'locators',
    title: 'Locator Library',
    description: 'Manage and optimize your element locators. See which locators are stable and which need attention.',
    route: '/locators',
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Extend QA Studio with powerful integrations like JIRA, BrowserStack, and more. Download the desktop app to access these features.',
    route: '/marketplace',
  },
];

interface DemoTourProps {
  opened: boolean;
  onClose: () => void;
  autoPlay?: boolean;
}

export function DemoTour({ opened, onClose, autoPlay = false }: DemoTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isNavigating, setIsNavigating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  useEffect(() => {
    if (opened && step) {
      // Navigate to the step's route using hash for HashRouter
      // Since we're outside Router context, use window.location.hash directly
      setIsNavigating(true);
      const hashRoute = step.route === '/' ? '#/' : `#${step.route}`;
      window.location.hash = hashRoute;
      // Small delay to let navigation complete
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [currentStep, opened, step]);

  useEffect(() => {
    if (isPlaying && opened && !isNavigating) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= tourSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000); // 5 seconds per step
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, opened, isNavigating]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleReplay = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  if (!opened || !step) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      withCloseButton={false}
      styles={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
        content: {
          position: 'relative',
        },
      }}
    >
      <Stack gap="md">
        {/* Progress bar */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Step {currentStep + 1} of {tourSteps.length}
            </Text>
            <Text size="sm" c="dimmed">
              {Math.round(progress)}%
            </Text>
          </Group>
          <Progress value={progress} size="sm" />
        </div>

                {/* Stepper */}
                <Stepper active={currentStep} size="xs">
                  {tourSteps.map((s, idx) => (
                    <Stepper.Step key={s.id} label={s.title} />
                  ))}
                </Stepper>

        {/* Content */}
        <div style={{ minHeight: '200px' }}>
          <Text size="xl" fw={700} mb="xs">{step.title}</Text>
          <Text size="sm" c="dimmed" mb="md">{step.description}</Text>
        </div>

        {/* Controls */}
        <Group justify="space-between">
          <Group>
            <Button
              variant="subtle"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              leftSection={<ArrowLeft size={16} />}
            >
              Previous
            </Button>
            <Button
              variant="subtle"
              onClick={isPlaying ? () => setIsPlaying(false) : () => setIsPlaying(true)}
              leftSection={isPlaying ? <Pause size={16} /> : <Play size={16} />}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="subtle"
              onClick={handleReplay}
              leftSection={<SkipForward size={16} />}
            >
              Replay
            </Button>
          </Group>
          <Group>
            <Button variant="subtle" onClick={handleSkip}>
              Skip Tour
            </Button>
            <Button
              onClick={handleNext}
              rightSection={currentStep === tourSteps.length - 1 ? <X size={16} /> : <ArrowRight size={16} />}
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}


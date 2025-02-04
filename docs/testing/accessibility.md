# Accessibility Documentation

## Overview

ReelMeals prioritizes accessibility by building on the strong foundation provided by shadcn/ui and Radix Primitives. This document explains how we ensure our video-centric application remains accessible to all users, combining the built-in accessibility features of our UI libraries with additional considerations specific to video content.

## Foundation: shadcn/ui and Radix

Our application builds on shadcn/ui, which uses Radix Primitives underneath. These libraries provide several key accessibility features out of the box:

### Built-in Accessibility Features

```typescript
// Example of a accessible video control using shadcn/ui Button
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

const VideoControlButton = ({
  isPlaying,
  onToggle,
  label
}: VideoControlProps) => {
  return (
    <Button
      // Radix handles ARIA attributes automatically
      variant="ghost"
      size="icon"
      onClick={onToggle}
      // Additional accessibility attributes
      aria-pressed={isPlaying}
      aria-label={label}
    >
      {isPlaying ? <Pause /> : <Play />}
    </Button>
  );
};
```

### Keyboard Navigation

Radix Primitives provide comprehensive keyboard support:

```typescript
// Example using Radix's Slider for video progress
import * as Slider from '@radix-ui/react-slider';

const VideoProgress = ({
  duration,
  currentTime,
  onSeek
}: VideoProgressProps) => {
  return (
    <Slider.Root
      // Keyboard step values
      step={1}
      min={0}
      max={duration}
      value={[currentTime]}
      onValueChange={([value]) => onSeek(value)}
      // Additional accessibility features
      aria-label="Video progress"
      // Custom styling using tailwind
      className="relative flex items-center w-full h-5"
    >
      <Slider.Track className="bg-secondary relative grow h-1">
        <Slider.Range className="absolute bg-primary h-full" />
      </Slider.Track>
      <Slider.Thumb className="block w-3 h-3 bg-primary rounded-full" />
    </Slider.Root>
  );
};
```

## Video-Specific Accessibility

While shadcn/ui and Radix handle many accessibility concerns, video content requires additional considerations:

### Captions and Transcripts

```typescript
interface CaptionConfig {
  // Supported caption formats
  formats: {
    webvtt: boolean;
    srt: boolean;
    ttml: boolean;
  };
  // Caption styling options
  styling: {
    position: 'overlay' | 'below';
    fontSize: string;
    background: string;
    textColor: string;
  };
}

const VideoCaptioning = ({
  videoId,
  language = 'en'
}: VideoCaptioningProps) => {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [activeCue, setActiveCue] = useState<Caption | null>(null);

  useEffect(() => {
    // Load captions for the current video
    loadCaptions(videoId, language);
  }, [videoId, language]);

  return (
    <div 
      role="region" 
      aria-label="Video captions"
      className="caption-container"
    >
      {activeCue && (
        <div className="caption-text">
          {activeCue.text}
        </div>
      )}
    </div>
  );
};
```

### Media Controls

We extend shadcn/ui's components to create accessible media controls:

```typescript
const AccessibleVideoControls = ({
  videoState,
  onTogglePlay,
  onSeek,
  onVolumeChange
}: VideoControlsProps) => {
  // Use shadcn/ui components with additional accessibility features
  return (
    <div
      role="region"
      aria-label="Video controls"
      className="video-controls"
    >
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePlay}
        aria-label={videoState.isPlaying ? 'Pause video' : 'Play video'}
      >
        {videoState.isPlaying ? <Pause /> : <Play />}
      </Button>

      {/* Volume Control using Radix Slider */}
      <Slider.Root
        defaultValue={[100]}
        max={100}
        step={1}
        aria-label="Volume"
        onValueChange={onVolumeChange}
      >
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>

      {/* Additional controls... */}
    </div>
  );
};
```

### Keyboard Shortcuts

We implement comprehensive keyboard controls:

```typescript
const VideoKeyboardControls = ({
  videoRef,
  onCommand
}: VideoKeyboardProps) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent default only for our specific shortcuts
      if (shouldPreventDefault(event.key)) {
        event.preventDefault();
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          onCommand('togglePlay');
          break;
        case 'k':
          onCommand('togglePlay');
          break;
        case 'm':
          onCommand('toggleMute');
          break;
        case 'f':
          onCommand('toggleFullscreen');
          break;
        case 'arrowright':
          onCommand('seekForward');
          break;
        case 'arrowleft':
          onCommand('seekBackward');
          break;
        case 'arrowup':
          onCommand('volumeUp');
          break;
        case 'arrowdown':
          onCommand('volumeDown');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onCommand]);

  return null; // This is a behavior-only component
};
```

### Focus Management

We implement custom focus management for video interactions:

```typescript
const VideoFocusManager = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Trap focus within video controls when they're visible
  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;
    
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    }
  }, []);
  
  useEffect(() => {
    window.addEventListener('keydown', trapFocus);
    return () => window.removeEventListener('keydown', trapFocus);
  }, [trapFocus]);
  
  return (
    <div ref={containerRef} className="focus-container">
      {children}
    </div>
  );
};
```

### Screen Reader Announcements

We provide contextual screen reader announcements for video events:

```typescript
const VideoAnnouncements = ({
  videoState,
  onStateChange
}: VideoAnnouncementsProps) => {
  const prevState = useRef(videoState);
  
  useEffect(() => {
    // Only announce meaningful changes
    if (videoState !== prevState.current) {
      const message = getAnnouncementMessage(videoState);
      announceToScreenReader(message);
      prevState.current = videoState;
    }
  }, [videoState]);
  
  const getAnnouncementMessage = (state: VideoState): string => {
    switch (state) {
      case 'playing':
        return 'Video is now playing';
      case 'paused':
        return 'Video paused';
      case 'buffering':
        return 'Video is buffering';
      case 'error':
        return 'Error playing video. Please try again.';
      default:
        return '';
    }
  };
  
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.classList.add('sr-only');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after announcement is made
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };
  
  return null; // This is a behavior-only component
};
```

### Motion Reduction

We respect user motion preferences:

```typescript
const VideoTransitions = () => {
  // Check user's motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  
  const transitionStyles = {
    // Conditional animations based on user preference
    transition: prefersReducedMotion 
      ? 'none' 
      : 'all 0.3s ease-in-out',
    // Use opacity for smoother transitions
    opacity: prefersReducedMotion ? 1 : 0.8
  };
  
  return transitionStyles;
};
```

## Testing Accessibility

We implement automated accessibility testing alongside our regular test suite:

```typescript
// tests/accessibility.test.tsx
import { axe } from 'jest-axe';

describe('Video Player Accessibility', () => {
  it('should not have any WCAG violations', async () => {
    const { container } = render(<VideoPlayer videoId="test-video" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard navigable', () => {
    render(<VideoPlayer videoId="test-video" />);
    
    // Test keyboard navigation
    userEvent.tab();
    expect(screen.getByRole('button', { name: /play/i }))
      .toHaveFocus();
    
    userEvent.tab();
    expect(screen.getByRole('slider', { name: /volume/i }))
      .toHaveFocus();
  });
});
```

## Best Practices

1. Always use semantic HTML elements
2. Maintain proper heading hierarchy
3. Provide text alternatives for visual content
4. Ensure sufficient color contrast
5. Support keyboard navigation
6. Respect user preferences for motion and animations
7. Test with screen readers regularly
8. Keep ARIA labels clear and concise

This comprehensive approach to accessibility ensures that our video application is usable by all users, regardless of their abilities or assistive technology needs.

---

*Version: 1.0.0*
*Last Updated: February 3, 2025*
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioPlayer } from '@/components/podcast/AudioPlayer';

// Mock HTMLAudioElement
const mockAudio = {
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 1800,
  volume: 1,
  paused: true,
};

Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio),
});

describe('AudioPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic controls', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        duration={1800}
      />
    );

    expect(screen.getByLabelText('Play')).toBeInTheDocument();
    expect(screen.getByLabelText('Seek audio position')).toBeInTheDocument();
    expect(screen.getByLabelText('Volume control')).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('renders simple audio element when showControls is false', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        showControls={false}
      />
    );

    const audioElement = screen.getByLabelText('Audio player for Test Audio');
    expect(audioElement).toBeInTheDocument();
    expect(audioElement.tagName).toBe('AUDIO');
    expect(screen.queryByLabelText('Play')).not.toBeInTheDocument();
  });

  it('toggles play/pause when button is clicked', async () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        duration={1800}
      />
    );

    const playButton = screen.getByLabelText('Play');
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(mockAudio.play).toHaveBeenCalled();
    });

    // After clicking play, button should show pause
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  it('handles volume control', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        duration={1800}
      />
    );

    const volumeSlider = screen.getByLabelText('Volume control');
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });

    expect(mockAudio.volume).toBe(0.5);
  });

  it('toggles mute when mute button is clicked', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        duration={1800}
      />
    );

    const muteButton = screen.getByLabelText('Mute');
    fireEvent.click(muteButton);

    expect(mockAudio.volume).toBe(0);
    expect(screen.getByLabelText('Unmute')).toBeInTheDocument();
  });

  it('handles seek functionality', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        duration={1800}
      />
    );

    const seekSlider = screen.getByLabelText('Seek audio position');
    fireEvent.change(seekSlider, { target: { value: '900' } });

    expect(mockAudio.currentTime).toBe(900);
  });

  it('shows loading state initially', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        duration={1800}
      />
    );

    const playButton = screen.getByLabelText('Play');
    expect(playButton).toBeDisabled();
    
    // Should show loading spinner
    const spinner = playButton.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('updates time display when audio progresses', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        duration={1800}
      />
    );

    // Simulate time update
    mockAudio.currentTime = 600;
    const timeUpdateCallback = mockAudio.addEventListener.mock.calls
      .find(call => call[0] === 'timeupdate')?.[1];
    
    if (timeUpdateCallback) {
      timeUpdateCallback();
    }

    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('handles audio end event', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        duration={1800}
      />
    );

    // Simulate audio end
    const endedCallback = mockAudio.addEventListener.mock.calls
      .find(call => call[0] === 'ended')?.[1];
    
    if (endedCallback) {
      endedCallback();
    }

    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  it('applies autoPlay when specified', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
        autoPlay={true}
        showControls={false}
      />
    );

    const audioElement = screen.getByLabelText('Audio player for Test Audio');
    expect(audioElement).toHaveAttribute('autoplay');
  });

  it('handles metadata loading', () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        title="Test Audio"
      />
    );

    // Simulate metadata loaded
    mockAudio.duration = 2400;
    const metadataCallback = mockAudio.addEventListener.mock.calls
      .find(call => call[0] === 'loadedmetadata')?.[1];
    
    if (metadataCallback) {
      metadataCallback();
    }

    expect(screen.getByText('40:00')).toBeInTheDocument();
  });
});
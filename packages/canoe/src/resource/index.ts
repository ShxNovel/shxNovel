import { StoryManager } from './story-manager';
import { FlagManager } from './flag-manager';
import { ManifestManager } from './manifest-manager';
import { TextureManager } from './texture-manager';
import { AudioManager } from './audio-manager';
import { WorldManager } from './world-manager';
import { SceneManager } from './scene-manager';
import { CameraManager } from './camera-manager';
import { RTManager } from './rt-manager';
import { VisualManager } from './visual-manager';
import { PipelineManager } from './pipeline-manager';
import { InGameData, GlobalData } from './data-manager';

export * from './story-manager';
export * from './flag-manager';
export * from './manifest-manager';
export * from './texture-manager';
export * from './audio-manager';
export * from './world-manager';
export * from './scene-manager';
export * from './camera-manager';
export * from './rt-manager';
export * from './visual-manager';
export * from './pipeline-manager';
export * from './data-manager';

// Expose to window for debugging
if (typeof window !== 'undefined') {
    (window as any).shx = {
        StoryManager,
        FlagManager,
        ManifestManager,
        TextureManager,
        AudioManager,
        WorldManager,
        SceneManager,
        CameraManager,
        RTManager,
        VisualManager,
        PipelineManager,
        InGameData,
        GlobalData
    };
}

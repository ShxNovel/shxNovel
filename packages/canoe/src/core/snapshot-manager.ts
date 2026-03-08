import { VisualManager } from '../resource/visual-manager';
import { CameraManager } from '../resource/camera-manager';
import { Pipeline } from '../object/pipeline';
import { InGameData } from '../resource/data-manager';

export interface GameSnapshot {
    timestamp: number;
    pipeline: {
        current: string;
    };
    cameras: any[];
    visuals: any[];
    variables: Record<string, any>;
}

export class SnapshotManager {
    /**
     * Capture the complete state of the engine
     */
    static async takeSnapshot(): Promise<GameSnapshot> {
        const cameras = await CameraManager.getInstances();
        const visuals = VisualManager.getInstances();

        return {
            timestamp: Date.now(),
            pipeline: {
                current: Pipeline.pipe_name
            },
            cameras: cameras.map(cam => cam.getState()),
            visuals: visuals.map(vis => vis.getState()),
            variables: InGameData.getState()
        };
    }

    /**
     * Restore the engine to a specific snapshot
     */
    static async applySnapshot(snapshot: GameSnapshot) {
        // 1. Restore Variables
        if (snapshot.variables) {
            InGameData.recover(snapshot.variables);
        }

        // 2. Restore Pipeline
        Pipeline.use(snapshot.pipeline.current);
        await Pipeline.build();

        // 3. Restore Cameras
        for (const camState of snapshot.cameras) {
            const cam = await CameraManager.get(camState.name);
            cam.recover(camState);
        }

        // 4. Restore Visuals
        const snapshotVisualNames = new Set(snapshot.visuals.map(v => v.name));
        const allVisuals = VisualManager.getInstances();
        
        // Remove visuals that exist in the engine but not in the snapshot
        for (const vis of allVisuals) {
            if (!snapshotVisualNames.has(vis.name)) {
                if (vis.parent) {
                    vis.parent.remove(vis);
                }
            }
        }

        const recoverPromises = snapshot.visuals.map(visState => 
            VisualManager.recover(visState.name, visState)
        );
        
        await Promise.all(recoverPromises);
    }
}

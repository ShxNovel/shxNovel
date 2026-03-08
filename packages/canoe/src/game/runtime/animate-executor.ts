import { 
    AnimateIR, 
    SystemIR, 
    ExtAnimateOp, 
    AnyAnimateProps 
} from '@shxnovel/schema';
import { logger } from '../../logger';
import {
    VisualManager,
    CameraManager,
    SceneManager,
} from '../../resource';
import { Pipeline } from '../../object/pipeline';
import { TimelineBuilder } from '../../core/timeline-builder';
import { type Timeline } from 'animejs';
import { renderScheduler } from '../../core';

export class AnimateExecutor {
    /**
     * 执行系统指令（如渲染管线切换）
     */
    static async executeSystem(system: SystemIR) {
        if (!system || system.length === 0) return;

        for (const op of system) {
            logger.debug(`[Executor] System op: ${op.kind}`);

            switch (op.kind) {
                case 'usePipeline':
                    const pipelineName = op.name;
                    if (pipelineName) {
                        Pipeline.use(pipelineName);
                        await Pipeline.build();
                    }
                    break;

                default:
                    logger.warn(`[Executor] Unknown system op: ${(op as any).kind}`);
            }
        }
    }

    /**
     * 执行动画指令集，构建主时间轴
     */
    static async executeAnimate(animate: AnimateIR): Promise<{ tl: Timeline } | null> {
        if (!animate || animate.length === 0) return null;

        // 1. 同步构建 Master Timeline
        const tl = TimelineBuilder.create({
            onUpdate: () => renderScheduler.requestRender()
        }) as Timeline;

        // 2. 异步解析并直接填充 Timeline (顺序填充)
        for (const op of animate) {
            await this.fillAnimOp(tl, op);
        }

        return { tl };
    }

    /**
     * 解析指令并直接填充 Timeline
     */
    private static async fillAnimOp(tl: Timeline, op: ExtAnimateOp): Promise<void> {
        const { kind, target } = op;
        const args = (op as any).args as AnyAnimateProps | undefined;
        const position = args?.timelabel;

        if (kind === 'timelabel') {
            tl.label(target, position);
            return;
        }

        // 分发给不同的资源管理器
        if (target.startsWith('v_')) {
            await this.fillVisualAnim(tl, kind, target, args, position);
        } else if (target.startsWith('c_')) {
            await this.fillCameraAnim(tl, target, args, position);
        } else {
            logger.warn(`[Executor] Unknown animate target prefix: ${target}`);
        }
    }

    /**
     * 填充视觉对象（Visual）的动画
     */
    private static async fillVisualAnim(
        tl: Timeline,
        kind: string, 
        target: string, 
        args?: AnyAnimateProps,
        position?: string | number
    ): Promise<void> {
        const visual = await VisualManager.get(target);
        const duration = args?.duration ?? 0;
        const ease = args?.easing ?? 'inOutQuad';

        // 1. 基础变换 (Position, Scale, Rotation)
        const props: any = { duration, ease };
        let hasProp = false;

        if (args?.position) {
            if (args.position.x !== undefined) { props.x = args.position.x; hasProp = true; }
            if (args.position.y !== undefined) { props.y = args.position.y; hasProp = true; }
            if (args.position.z !== undefined) { props.z = args.position.z; hasProp = true; }
        }

        if (args?.scale) {
            if (args.scale.x !== undefined) { props.scaleX = args.scale.x; hasProp = true; }
            if (args.scale.y !== undefined) { props.scaleY = args.scale.y; hasProp = true; }
            if (args.scale.z !== undefined) { props.scaleZ = args.scale.z; hasProp = true; }
        }

        if (args?.rotation) {
            if (args.rotation.x !== undefined) { props.rotationX = args.rotation.x; hasProp = true; }
            if (args.rotation.y !== undefined) { props.rotationY = args.rotation.y; hasProp = true; }
            if (args.rotation.z !== undefined) { props.rotationZ = args.rotation.z; hasProp = true; }
        }

        if (hasProp) {
            tl.add(visual, props, position);
        }

        // 2. 表达式 (Expressions / Variants)
        if (args?.expr) {
            for (const expr of args.expr) {
                await visual.addExpressionAnim(tl, expr, { duration, ease, position });
            }
        }

        // 3. 进场/出场 (Stage Management)
        if (kind === 'enter') {
            const stageName = args?.into || 's_main';
            const stage = await SceneManager.get(stageName);
            tl.add({
                duration: 0,
                onComplete: () => { stage.add(visual); }
            }, position);
        } else if (kind === 'leave') {
            tl.add({
                duration: 0,
                onComplete: () => { visual.parent?.remove(visual); }
            }, position);
        }
    }

    /**
     * 填充相机（Camera）的动画
     */
    private static async fillCameraAnim(
        tl: Timeline,
        target: string, 
        args?: AnyAnimateProps,
        position?: string | number
    ): Promise<void> {
        const canoeCam = await CameraManager.get(target);
        const duration = args?.duration ?? 0;
        const ease = args?.easing ?? 'inOutQuad';

        // 1. 相机位移
        const props: any = { duration, ease };
        let hasProp = false;

        if (args?.position) {
            if (args.position.x !== undefined) { props.x = args.position.x; hasProp = true; }
            if (args.position.y !== undefined) { props.y = args.position.y; hasProp = true; }
            if (args.position.z !== undefined) { props.z = args.position.z; hasProp = true; }
        }

        if (hasProp) {
            tl.add(canoeCam, props, position);
        }

        // 2. 相机特有属性 (Zoom / FOV)
        if (args?.zoom !== undefined) {
            // 注意：Camera.setZoom 仍然返回一个 timeline，我们需要改为 add 模式
            // 这里我们手动添加 zoom 动画，或者稍后重构 Camera 类
            tl.add(canoeCam.cam, {
                zoom: args.zoom,
                duration,
                ease,
                onUpdate: () => {
                    canoeCam.cam.updateProjectionMatrix();
                }
            }, position);
        }
    }
}

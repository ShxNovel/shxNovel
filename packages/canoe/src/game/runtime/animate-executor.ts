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
import { createTimeline, type Timeline } from 'animejs';
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

        // 1. 异步解析所有动画单元（加载资源、获取实例）
        const tasks: any[] = [];
        for (const op of animate) {
            const task = await this.resolveAnimOp(op);
            if (task) tasks.push(task);
        }

        // 2. 同步构建 Master Timeline
        // 增加 onUpdate 确保动画播放时每一帧都触发渲染
        const tl = TimelineBuilder.create({
            onUpdate: () => renderScheduler.requestRender()
        }) as Timeline;

        for (const task of tasks) {
            const position = task.position; // timelabel 或 绝对时间

            if (task.kind === 'timelabel') {
                tl.label(task.name, position);
            } else if (task.anim) {
                // 将解析出的子动画同步到主时间轴
                tl.sync(task.anim, position);
            }
        }

        return { tl };
    }

    /**
     * 解析单条动画指令
     */
    private static async resolveAnimOp(op: ExtAnimateOp): Promise<any> {
        const { kind, target } = op;
        const args = (op as any).args as AnyAnimateProps | undefined;
        const position = args?.timelabel;

        if (kind === 'timelabel') {
            return { kind: 'timelabel', name: target, position };
        }

        // 根据前缀分发给不同的资源管理器
        if (target.startsWith('v_')) {
            const res = await this.getVisualAnim(kind, target, args);
            return { kind: 'visual', anim: res?.anim, position };
        } else if (target.startsWith('c_')) {
            const res = await this.getCameraAnim(target, args);
            return { kind: 'camera', anim: res?.anim, position };
        }

        logger.warn(`[Executor] Unknown animate target prefix: ${target}`);
        return null;
    }

    /**
     * 处理视觉对象（Visual）的动画
     */
    private static async getVisualAnim(
        kind: string, 
        target: string, 
        args?: AnyAnimateProps
    ): Promise<{ anim: Timeline } | null> {
        const visual = await VisualManager.get(target);
        const duration = args?.duration ?? 0;
        const ease = args?.easing ?? 'inOutQuad';

        const tl = createTimeline({
            autoplay: false,
            onUpdate: () => renderScheduler.requestRender(),
            onComplete: () => renderScheduler.requestRender(),
        });

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
            tl.add(visual, props, 0);
        }

        // 2. 表达式 (Expressions / Variants)
        if (args?.expr) {
            for (const expr of args.expr) {
                const res = await visual.applyExpression(expr, { duration, ease });
                if (res?.anim) tl.sync(res.anim, 0);
            }
        }

        // 3. 进场/出场 (Stage Management)
        if (kind === 'enter') {
            const stageName = args?.into || 's_main';
            const stage = await SceneManager.get(stageName);
            tl.call(() => { stage.add(visual); }, 0);
        } else if (kind === 'leave') {
            tl.call(() => { visual.parent?.remove(visual); }, 0);
        }

        return { anim: tl };
    }

    /**
     * 处理相机（Camera）的动画
     */
    private static async getCameraAnim(
        target: string, 
        args?: AnyAnimateProps
    ): Promise<{ anim: Timeline } | null> {
        const canoeCam = await CameraManager.get(target);
        const duration = args?.duration ?? 0;
        const ease = args?.easing ?? 'inOutQuad';

        const tl = createTimeline({
            autoplay: false,
            onUpdate: () => renderScheduler.requestRender(),
            onComplete: () => renderScheduler.requestRender(),
        });

        // 1. 相机位移
        const props: any = { duration, ease };
        let hasProp = false;

        if (args?.position) {
            if (args.position.x !== undefined) { props.x = args.position.x; hasProp = true; }
            if (args.position.y !== undefined) { props.y = args.position.y; hasProp = true; }
            if (args.position.z !== undefined) { props.z = args.position.z; hasProp = true; }
        }

        if (hasProp) {
            tl.add(canoeCam, props, 0);
        }

        // 2. 相机特有属性 (Zoom / FOV)
        if (args?.zoom !== undefined) {
            tl.sync(canoeCam.setZoom(args.zoom, duration, ease), 0);
        }

        return { anim: tl };
    }
}

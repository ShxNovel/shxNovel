useChapter("1.1.1");

const aside = character(null);
const me = character("卡咖喱");

const stage = scene("s_main");
const school = visual("v_bg");

flag("start");

aside`静谧的森林中，温和的阳光从树叶的空隙间筛落下来。`;
school.act.expr("body:p0");
school.enter.into(stage);

me`滴答。`;
school.act.expr("body:p1").duration(1000);

aside`一阵水声突然响彻其间。`
school.act.expr("body:p2").duration(1000);

me`神人 —— 正张大了嘴呆站在那里。`
school.act.expr("body:p3").duration(1000);

aside`是一个女孩。他的眼前有个全裸的女孩。`
school.leave;

jump("start2");

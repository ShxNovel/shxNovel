useChapter("1.1.1");

const aside = character(null);
const me = character("卡咖喱");

const stage = scene("s_main");
const school = visual("v_bg");
const stand = visual("v_stand");

flag("start");

aside`静谧的森林中，温和的阳光从树叶的空隙间筛落下来。`;
school.act.expr("body:p0");
school.enter.into(stage);
stand.act.y(-500);
stand.act.expr("body:s1")
stand.enter.into(stage);


me`滴答。`;
school.act.expr("body:p1").duration(1000);
stand.act.expr("body:s2").duration(300);


aside`一阵水声突然响彻其间。`
school.act.expr("body:p2").duration(1000);
stand.act.y("+=100").duration(100);
stand.act.y("-=100").duration(100);


me`神人 —— 正张大了嘴呆站在那里。`
school.act.expr("body:p3").duration(1000);
stand.act.x("+=50").duration(100);
stand.act.x("-=100").duration(100);
stand.act.x("+=50").duration(100);


aside`是一个女孩。他的眼前有个全裸的女孩。`
school.leave;


jump("start2");

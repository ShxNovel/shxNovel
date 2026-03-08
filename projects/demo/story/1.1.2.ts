useChapter("1.1.2");

const aside = character(null);
const me = character("卡咖喱");

const stage = scene("s_main");
const school = visual("v_bg");
const cam = camera("c_main");

flag("start2");

aside`而且还长得非常可爱，十分正点。`;
school.act.expr("body:p0");
school.enter.into(stage);

me`一双大眼睛里有一对红宝石般的眼眸。淡淡的粉红色嘴唇艳丽而湿润。`;
school.act.expr("body:p1").duration(1000);

aside`肌肤如牛奶般滑顺，雪白耀眼得令人无法直视。`
school.act.expr("body:p2").duration(1000);

me`水面上的一双腿纤细而修长，是一双美腿。`
school.act.expr("body:p3").duration(1000);

aside`还有，最惹人注目的是——`

me`打断一下刚刚是《精灵使的剑舞》，这里晃一下镜头`
cam.act.x("+=100").duration(100);
cam.act.x("-=200").duration(100);
cam.act.x("+=100").duration(100);

me`然后背景淡出`;
school.act.expr("0#self").duration(1000);
school.leave;

jump("start");
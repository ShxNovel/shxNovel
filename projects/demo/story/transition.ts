useChapter("transition_demo");

flag("emm");

const aside = character(null);
const stage = scene("s_main");
const school = visual("v_bg");
const transition = visual("v_transition");
const blinds = visual("v_blinds");
const fx_trans = visual("v_fx_trans");

// 1. Initial setup
aside`进行一个黑幕转场。`;
school.enter.into(stage);
school.act.expr("body:p0");


// 2. Start the transition (Fade to black)
// Render order must be high to cover everything
aside`现在屏幕应该是全黑的，趁现在偷偷换背景。（这句话结束后会自动播放下一句）`;
// transition.act.renderOrder(999);
// transition.enter.into(stage);
// transition.act.expr("fade_in").duration(1000);
// blinds.act.renderOrder(999).z(1);
// blinds.enter.into(stage);
// blinds.act.expr("open").duration(1000)
fx_trans.act.renderOrder(999).z(1);
fx_trans.enter.into(stage);
fx_trans.act.expr("appear").duration(1000)
directive.SceneBindNext;


// 3. Change things behind the mask instantly
aside`背景已经换好了，准备拉开黑幕。（这句话结束后会自动播放下一句）`;
// school.act.expr("body:p2");
school.act.expr("1#self", "body:p0");
directive.SceneBindNext;


// 4. End the transition (Fade out)
aside`好吧就是前面叠了个黑幕，然后对这个黑幕跑一个着色器动画，听起来真抱歉！`;
// transition.act.expr("fade_out").duration(1000);
// blinds.act.expr("close").duration(1000)
fx_trans.act.expr("disappear").duration(1000)


// Clean up
// transition.leave;
fx_trans.leave;
// school.leave;

aside`然后就会回到开头的世界。`;


jump("start");
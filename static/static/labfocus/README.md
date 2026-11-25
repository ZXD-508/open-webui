# labfocus 首页素材

- `brand-whale.png`：用户提供的鲸鱼图片，裁切与透明背景处理后用于本地站点标识。
- `fish-companion-pillow-v2.webp`：8 列 × 6 行精灵图；每帧 320 × 320。行顺序为 idle、greeting、thinking、happy、sleep、drag。sleep 是趴在用户指定鲸鱼抱枕上的睡姿。
- `fish-idle.png`：静态加载回退图。
- `fish-login.webp`：登录/注册页静态透明插画，来自原型 `assets/fish-ip.png` 的用户参考裁切图；仅裁切透明留白并转换为 WebP（333×347），不使用整张精灵图。

角色基于用户参考图，六张关键姿势使用本地 gpt-image-gen 技能配置的 jimeng-image-5.0-lite 生成；帧内呼吸、摇摆和跳跃由本地变换制作，不是 48 张独立生成帧。原始参考、生成图与记录保留于原型项目 chat-ip-prototypes。

图片权利与商业授权未核实。此文件不表示原创、授权或与相关品牌的官方关联。Open WebUI 源 LICENSE、版权与可见标识继续保留。

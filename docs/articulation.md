# Phidias 關節定義指南

本文件說明 Phidias 編輯器中的語意標籤（Semantic Tags）與關節（Joints）設定項目。

---

## 目錄

1. [零件語意標籤](#零件語意標籤)
   - [類型 (Type)](#類型-type)
   - [角色 (Role)](#角色-role)
   - [活動性 (Mobility)](#活動性-mobility)
2. [關節定義](#關節定義)
   - [關節類型](#關節類型)
   - [旋轉軸](#旋轉軸)
3. [實際範例](#實際範例)

---

## 零件語意標籤

當你選擇一個零件後，可以在右側的「Tags」面板設定三種語意標籤。

### 類型 (Type)

**用途：** 標記這個零件在機器人中扮演的結構角色。

| 類型 | 英文 | 說明 | 使用情境 |
|------|------|------|----------|
| **基座** | `base` | 固定在世界座標的根部零件 | 機器人底座、固定在地面或桌面的部分 |
| **連桿** | `link` | 可動的剛體零件 | 機械手臂的各節、腿部關節之間的部分 |
| **工具** | `tool` | 末端執行器 | 夾爪、吸盤、焊接頭等終端工具 |
| **關節** | `joint` | 連接點標記（較少使用） | 特殊標記用途 |

#### 💡 白話解釋

想像一台機械手臂：

```
🏠 base（基座）= 鎖在桌上不會動的底座
    ↓
🦴 link（連桿）= 手臂的每一節，可以轉動或滑動
    ↓
🦴 link（連桿）= 第二節手臂
    ↓
🤏 tool（工具）= 最前面的夾爪，負責抓取物體
```

**重要原則：**
- 每個模型應該有 **剛好一個** base（基座）
- base 會在模擬中固定不動
- 其他會動的部分都標記為 link 或 tool

---

### 角色 (Role)

**用途：** 描述這個零件的功能用途，幫助理解機器人結構。

| 角色 | 英文 | 說明 | 範例 |
|------|------|------|------|
| **驅動器** | `actuator` | 提供動力或運動的部分 | 馬達外殼、驅動軸 |
| **支撐件** | `support` | 提供結構支撐 | 框架、外殼、固定架 |
| **夾爪** | `gripper` | 抓取機構 | 平行夾爪、吸盤 |
| **感測器** | `sensor` | 安裝感測器的位置 | 攝影機支架、力感測器座 |
| **其他** | `other` | 不屬於以上類別 | 裝飾件、蓋板 |

#### 💡 白話解釋

這個標籤主要是幫助你 **描述** 每個零件的用途：

- 「這個零件是 **馬達**，負責轉動」→ 選 `actuator`
- 「這個零件是 **框架**，只是固定用」→ 選 `support`  
- 「這個零件是 **夾子**，會夾東西」→ 選 `gripper`
- 「這邊要裝 **攝影機**」→ 選 `sensor`
- 「這只是外觀裝飾」→ 選 `other`

**注意：** 這個標籤目前主要用於標記和理解，不影響物理模擬。

---

### 活動性 (Mobility)

**用途：** 描述這個零件如何移動（或不移動）。

| 活動性 | 英文 | 說明 | 運動方式 |
|--------|------|------|----------|
| **固定** | `fixed` | 不能移動，與父件焊死 | 完全鎖定 |
| **旋轉** | `revolute` | 繞著軸心旋轉 | 像門鉸鏈、手肘 |
| **滑動** | `prismatic` | 沿著軸線滑動 | 像抽屜、活塞 |

#### 💡 白話解釋

```
fixed（固定）= 🔒 完全不會動，像焊接在一起
              例如：外殼固定在框架上

revolute（旋轉）= 🔄 可以轉動，像開門
                  例如：手臂關節、輪子

prismatic（滑動）= ↔️ 可以前後滑動，像抽屜
                   例如：夾爪開合、升降台
```

---

## 關節定義

關節（Joint）定義了兩個零件之間的運動關係。

### 關節屬性

| 屬性 | 說明 |
|------|------|
| **名稱** | 關節的識別名稱，例如 `shoulder_joint` |
| **父件 (Parent)** | 上游零件，較靠近基座的那個 |
| **子件 (Child)** | 下游零件，較靠近末端的那個 |
| **類型 (Type)** | revolute / prismatic / fixed |
| **軸向 (Axis)** | 旋轉或滑動的方向 |

### 關節類型

#### 🔄 Revolute（旋轉關節）

**如同：** 門鉸鏈、手肘、膝蓋

```
     軸心
      ↓
    ──┼──
   ↗     ↘
  轉        轉
```

**使用情境：**
- 機械手臂的肩關節、肘關節
- 輪子的轉軸
- 機器人頭部的轉動

**常見組合：**
- Z 軸旋轉 = 水平面轉動（像轉頭）
- Y 軸旋轉 = 前後傾斜（像點頭）
- X 軸旋轉 = 左右傾斜（像搖頭）

---

#### ↔️ Prismatic（滑動關節）

**如同：** 抽屜、活塞、電梯

```
  ←───────→
  滑動方向
```

**使用情境：**
- 夾爪的開合動作
- 升降平台
- 線性滑軌

**常見組合：**
- X 軸滑動 = 左右滑動
- Y 軸滑動 = 前後滑動
- Z 軸滑動 = 上下滑動

---

#### 🔒 Fixed（固定關節）

**如同：** 焊接、螺栓固定

```
  ████████
  完全鎖定
```

**使用情境：**
- 多個零件需要一起移動
- 外殼固定在框架上
- 感測器固定在支架上

---

### 旋轉軸

選擇關節的運動軸向：

| 軸 | 方向 | 圖示 |
|----|------|------|
| **X** | 左右方向（紅色軸） | →  |
| **Y** | 前後方向（綠色軸） | ↗  |
| **Z** | 上下方向（藍色軸） | ↑  |

#### 💡 如何選擇軸向？

想像你站在機器人前面：
- **Z 軸旋轉**：像轉動方向盤，在水平面上轉
- **Y 軸旋轉**：像點頭，前後傾斜
- **X 軸旋轉**：像搖頭說不，左右傾斜

---

### 關節限制 (Joint Limits)

**用途：** 限制關節的運動範圍，防止過度旋轉或滑動。

| 參數 | 單位 | 說明 |
|------|------|------|
| **下限 (Lower)** | 度 / 米 | 最小允許的角度或位置 |
| **上限 (Upper)** | 度 / 米 | 最大允許的角度或位置 |

#### 💡 白話解釋

```
關節限制就像門的鉸鏈有個擋板：
- 門只能開到 90°（上限）
- 不能往反方向開（下限 = 0°）

沒有限制的關節 = 可以無限轉動（像輪子）
有限制的關節 = 只能在某個範圍內動（像手肘）
```

#### 常見設定範例：

| 關節類型 | 下限 | 上限 | 說明 |
|----------|------|------|------|
| 手肘關節 | 0° | 150° | 手肘不能往後彎 |
| 肩膀旋轉 | -180° | 180° | 可以轉一整圈 |
| 夾爪開合 | 0m | 0.05m | 最多開 5 公分 |
| 升降台 | 0m | 1m | 最多升高 1 米 |

---

### 驅動器 (Joint Drive)

**用途：** 定義關節的馬達/控制器，讓機器人可以被控制。

| 參數 | 說明 | 典型值 |
|------|------|--------|
| **控制模式** | position / velocity / none | position |
| **剛度 (Stiffness)** | PD 控制的 Kp，越高越硬 | 1000 |
| **阻尼 (Damping)** | PD 控制的 Kd，防止震盪 | 100 |
| **最大力矩** | 馬達最大輸出力 | 1000 |

#### 💡 白話解釋

```
驅動器 = 關節上的馬達

沒有驅動器的關節 = 像布娃娃的手腳，被動地晃動
有驅動器的關節 = 像真正的機器人，可以主動控制位置

⚡ Position Control（位置控制）：
   「我要關節轉到 45°」→ 馬達自動出力轉到目標

⚡ Velocity Control（速度控制）：
   「我要關節以 1 rad/s 轉動」→ 馬達維持恆定速度
```

#### 剛度與阻尼的比喻：

```
剛度 (Stiffness) = 彈簧的硬度
├── 高剛度 = 快速到達目標，但可能震盪
└── 低剛度 = 慢慢移動，比較平滑

阻尼 (Damping) = 避震器
├── 高阻尼 = 移動緩慢，幾乎不會震盪
└── 低阻尼 = 可能會來回晃動

🎯 調參建議：
- 一般情況：Stiffness = 1000, Damping = 100
- 需要快速響應：Stiffness = 5000, Damping = 200
- 需要平滑運動：Stiffness = 500, Damping = 50
```

---

## 實際範例

### 範例 1：簡單機械手臂

```
模型結構：
├── base_plate      → Type: base, Role: support, Mobility: fixed
├── shoulder_link   → Type: link, Role: actuator, Mobility: revolute
├── elbow_link      → Type: link, Role: actuator, Mobility: revolute
├── wrist_link      → Type: link, Role: actuator, Mobility: revolute
└── gripper         → Type: tool, Role: gripper, Mobility: prismatic

關節定義：
1. shoulder_joint: base_plate → shoulder_link (revolute, Z軸)
2. elbow_joint: shoulder_link → elbow_link (revolute, Y軸)
3. wrist_joint: elbow_link → wrist_link (revolute, Z軸)
4. gripper_joint: wrist_link → gripper (prismatic, X軸)
```

**解釋：**
- 基座固定不動
- 肩膀可以左右轉（Z軸）
- 手肘可以前後彎（Y軸）
- 手腕可以旋轉（Z軸）
- 夾爪可以開合（X軸滑動）

---

### 範例 2：四輪車

```
模型結構：
├── chassis         → Type: base, Role: support
├── front_left_wheel  → Type: link, Role: actuator
├── front_right_wheel → Type: link, Role: actuator
├── rear_left_wheel   → Type: link, Role: actuator
└── rear_right_wheel  → Type: link, Role: actuator

關節定義：
1. fl_wheel_joint: chassis → front_left_wheel (revolute, Y軸)
2. fr_wheel_joint: chassis → front_right_wheel (revolute, Y軸)
3. rl_wheel_joint: chassis → rear_left_wheel (revolute, Y軸)
4. rr_wheel_joint: chassis → rear_right_wheel (revolute, Y軸)
```

**解釋：**
- 車身是基座
- 四個輪子都是可轉動的連桿
- 輪子繞 Y 軸轉動（像自行車輪）

---

### 範例 3：抽屜櫃

```
模型結構：
├── cabinet_frame   → Type: base, Role: support
├── drawer_1        → Type: link, Role: other
├── drawer_2        → Type: link, Role: other
└── drawer_3        → Type: link, Role: other

關節定義：
1. drawer1_joint: cabinet_frame → drawer_1 (prismatic, Y軸)
2. drawer2_joint: cabinet_frame → drawer_2 (prismatic, Y軸)
3. drawer3_joint: cabinet_frame → drawer_3 (prismatic, Y軸)
```

**解釋：**
- 櫃子框架固定
- 每個抽屜可以前後滑動（Y軸）

---

## 常見問題

### Q: 每個零件都需要設定標籤嗎？

**A:** 建議都設定，但至少要：
- 設定一個 `base` 作為基座
- 會動的零件設定正確的 `mobility`

### Q: 如何決定父件和子件？

**A:** 順著運動鏈從基座往末端看：
- **父件** = 較靠近基座的零件
- **子件** = 較靠近末端的零件

例如手臂：`基座 → 肩膀 → 手肘 → 手腕 → 夾爪`

### Q: 可以一個父件連接多個子件嗎？

**A:** 可以！這叫做分支結構（Branching）：
```
            ┌── 左夾爪
手腕 ──────┤
            └── 右夾爪
```

### Q: 為什麼我的模型在模擬時爆開？

**A:** 可能原因：
1. 零件在初始位置有重疊
2. 沒有設定基座（base）
3. 關節方向設定錯誤

---

## 延伸閱讀

- [USD Physics 官方文檔](https://openusd.org/docs/api/usd_physics_page_front.html)
- [NVIDIA Isaac Sim 文檔](https://docs.omniverse.nvidia.com/isaacsim/latest/index.html)

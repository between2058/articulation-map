# Phidias Workflow Example: The Bulldozer

此範例展示如何將一個從 **Phidias Generator** 生成並經過整理的 3D 推土機模型，透過 **Articulation Editor** 轉化為 Nvidia Isaac Sim 可用的 Sim-Ready 資產。

---

## 0. 起點：Phidias Generator

假設你在 Phidias Generator 中生成了一台推土機，並完成了以下前置作業：

1.  **3D Mesh Generation**: 生成了高細節的推土機模型。
2.  **Part Segmentation**: 將模型切割為獨立的部件。
3.  **Smart Organization**: 透過 AI 自動命名並整理了層級：
    *   `chassis` (車身/底盤)
    *   `front_wheel_left`, `front_wheel_right` (前輪)
    *   `rear_wheel_left`, `rear_wheel_right` (後輪)
    *   `lift_arm` (舉升臂)
    *   `bucket` (鏟斗)

你導出了一個 `bulldozer.glb` 檔案。現在，我們進入 Articulation Editor。

---

## 1. Upload & Inspect (匯入與檢查)

將 `bulldozer.glb` 拖入編輯器。

*   **視覺檢查**: 旋轉模型，確認所有部件都在正確位置。
*   **列表檢查**: 左側列表應列出所有整理好的部件名稱 (`chassis`, `wheels`, `arm`, `bucket`)。

---

## 2. Semantics & Physics (語意與物理屬性)

這是 Sim-Ready 的關鍵步驟。我們需要告訴物理引擎每個部件是什麼、有多重、表面材質如何。

### A. Chassis (車身)
底盤是機器人的核心，負責承載所有重量。
*   **Tags**: `Type: base`, `Role: support`, `Mobility: fixed` (相對於世界座標)。
*   **Mass**: 設定 **Manual Mass** 為 `2000 kg` (推土機很重)。
*   **Collision**: 選擇 `Convex Hull` (穩定且快速)。

### B. Wheels (輪子)
輪子負責移動，需要高摩擦力才能抓地。
*   **Tags**: `Type: link`, `Role: actuator`, `Mobility: revolute`.
*   **Physics Material**:
    *   **Static Friction**: `1.0` (抓地力強)。
    *   **Dynamic Friction**: `0.9` (避免打滑)。
    *   **Restitution**: `0.0` (不彈跳)。

### C. Arm & Bucket (手臂與鏟斗)
這些是鋼製的重型機具。
*   **Tags**: `Type: link` / `tool`.
*   **Mass (Density)**: 使用 `Autocompute`，密度設為 `7800` (鋼鐵 density)。
*   **Collision**: 
    *   Arm 使用 `Convex Hull`。
    *   Bucket (鏟斗) 使用 **`Convex Decomposition`**。
        *   *為什麼？* 因為鏟斗是凹的（Concave），如果用 Convex Hull 會把開口封住，無法裝土。Decomposition 會將其分解為多塊凸包，保留凹槽形狀。

---

## 3. Joint Definition (定義關節)

依照運動鏈（Kinematic Chain）建立關節。

### 步驟 1: 驅動輪 (Chassis → Wheels)
建立 4 個關節，連接底盤與四個輪子。
*   **Type**: `Revolute` (旋轉)。
*   **Axis**: `Y Axis` (假設輪子側面朝 Y)。
*   **Anchor**: 使用 3D 視圖，將**黃色錨點**拖曳到輪子的**圓心**。
*   **Drive**:
    *   Type: `Velocity` (速度控制，因為是用來開車的)。
    *   Stiffness: `0` (不需要位置剛度)。
    *   Damping: `1000` (模擬軸承摩擦)。

### 步驟 2: 舉升臂 (Chassis → Arm)
連接底盤與手臂。
*   **Type**: `Revolute` (旋轉)。
*   **Axis**: `X Axis` (上下舉升)。
*   **Anchor**: 拖曳到手臂與車身的連接軸心。
*   **Drive**:
    *   Type: `Position` (位置控制，我们要控制角度)。
    *   Stiffness: `100000` (非常硬，才能舉起重物)。
    *   Damping: `5000`。
*   **Limits**: 設定 `-10°` (貼地) 到 `45°` (舉高)。

### 步驟 3: 鏟斗 (Arm → Bucket)
連接手臂與鏟斗。
*   **Type**: `Revolute` (翻轉)。
*   **Anchor**: 拖曳到鏟斗的旋轉軸。
*   **Collision Filtering**: **務必勾選** `Disable Collision with Parent`。
    *   *為什麼？* 鏟斗跟手臂的轉軸處通常模型是穿插的。如果不關閉碰撞，一開始模擬就會爆炸。

---

## 4. Export & Integrate (導出與整合)

點擊 **Export USD** 下載 `bulldozer.usda`。

### 在 NVIDIA Isaac Sim 中：
1.  匯入 `bulldozer.usda`。
2.  加入 `Physics Ground Plane`。
3.  按 Play ▶️。

**預期結果：**
*   推土機穩穩地落在地上（因為有設定 Mass）。
*   輪子抓地力良好，可以推動（因為有設定 Friction）。
*   手臂可以舉高不垂落（因為 Drive Stiffness 夠高）。
*   鏟斗可以裝載物體（因為使用了 Convex Decomposition）。

這就是從 Phidias Generator 到 Sim-Ready Asset 的完整旅程。

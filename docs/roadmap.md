# Phidias 功能路線圖
## 從 MVP 到完整 Sim-Ready Asset Pipeline

---

## 📊 目前 MVP 狀態

### ✅ 已實作功能

| 功能 | 狀態 | 說明 |
|------|------|------|
| GLB 上傳與解析 | ✅ 完成 | 使用 trimesh 解析 mesh |
| 3D 模型預覽 | ✅ 完成 | Three.js + react-three-fiber |
| 零件選取與標籤 | ✅ 完成 | Type / Role / Mobility |
| 關節定義 | ✅ 完成 | Revolute / Prismatic / Fixed |
| USD 匯出 | ✅ 完成 | 含 UsdPhysics schemas |
| ArticulationRootAPI | ✅ 完成 | 標記 articulation 根節點 |
| RigidBodyAPI | ✅ 完成 | 每個零件都有 |
| CollisionAPI | ✅ 完成 | Mesh collision |
| PhysicsScene | ✅ 完成 | 重力設定 |

---

## 🔴 缺少的關鍵功能（高優先級）

這些功能對於真正的 sim-ready asset 是 **必要的**：

### 1. 關節限制與參數 (Joint Limits & Parameters)

**現況問題：**
- 目前關節沒有設定旋轉/滑動範圍限制
- 沒有速度、力矩限制
- 在模擬中關節可能無限制轉動

**需要新增：**
```
Joint Properties:
├── lower_limit: float     # 最小角度/位移 (例如 -180°)
├── upper_limit: float     # 最大角度/位移 (例如 +180°)
├── max_velocity: float    # 最大速度 (rad/s 或 m/s)
├── max_force: float       # 最大力矩/力 (Nm 或 N)
└── default_position: float # 初始位置
```

**Isaac Sim 對應：**
- `UsdPhysics.RevoluteJoint.CreateLowerLimitAttr()`
- `UsdPhysics.RevoluteJoint.CreateUpperLimitAttr()`

**開發工作量：** 🟡 中（2-3 天）

---

### 2. 關節驅動器 (Joint Drives)

**現況問題：**
- 目前關節是「自由」的，沒有控制力
- 無法設定 PD 控制器參數
- 機器人會像布娃娃一樣癱軟

**需要新增：**
```
Joint Drive:
├── stiffness: float      # 剛度 (位置控制強度)
├── damping: float        # 阻尼 (速度控制強度)
├── max_force: float      # 驅動器最大輸出力
└── drive_type: enum      # position / velocity / force
```

**Isaac Sim 對應：**
- `UsdPhysics.DriveAPI`
- `PhysxSchema.JointDriveAPI` (NVIDIA 特有)

**開發工作量：** 🟡 中（2-3 天）

---

### 3. 質量與慣性設定 (Mass & Inertia)

**現況問題：**
- 目前只用密度自動計算質量
- 無法手動設定每個零件的質量
- 慣性張量無法自訂

**需要新增：**
```
Mass Properties:
├── mass: float           # 質量 (kg)
├── center_of_mass: vec3  # 質心位置
└── inertia_tensor: mat3  # 慣性張量 (可選，自動計算)
```

**Isaac Sim 對應：**
- `UsdPhysics.MassAPI.CreateMassAttr()`
- `UsdPhysics.MassAPI.CreateCenterOfMassAttr()`

**開發工作量：** 🟢 低（1-2 天）

---

### 4. 碰撞近似形狀 (Collision Approximation)

**現況問題：**
- 目前使用完整 mesh 作為碰撞體
- Mesh collision 計算成本高
- 可能導致模擬不穩定

**需要新增：**
```
Collision Type:
├── mesh          # 完整網格（精確但慢）
├── convex_hull   # 凸包（推薦）
├── box           # 方形包圍盒
├── sphere        # 球形
├── capsule       # 膠囊形
└── decomposition # 凸分解（複雜形狀用）
```

**Isaac Sim 對應：**
- `UsdPhysics.MeshCollisionAPI.CreateApproximationAttr()`
- `PhysxSchema.PhysxConvexHullCollisionAPI`

**開發工作量：** 🔴 高（3-5 天，需要實作凸包計算）

---

### 5. 關節位置/偏移編輯器 (Joint Frame Editor)

**現況問題：**
- 目前關節位置預設在子零件原點
- 無法調整關節軸心位置
- 很多模型的關節軸不在零件原點

**需要新增：**
```
Joint Frame:
├── anchor_position: vec3  # 關節錨點位置
├── anchor_rotation: quat  # 關節框架旋轉
├── visual_gizmo          # 3D 視覺化編輯器
└── snap_to_vertex        # 吸附到頂點
```

**開發工作量：** 🔴 高（5-7 天，需要 3D gizmo 互動）

---

## 🟡 重要但非必要功能（中優先級）

### 6. 材質物理屬性 (Physics Materials)

```
Material Properties:
├── static_friction: float   # 靜摩擦係數 (0-1)
├── dynamic_friction: float  # 動摩擦係數 (0-1)
├── restitution: float       # 彈性係數 (0-1)
└── density: float           # 密度 (kg/m³)
```

**開發工作量：** 🟢 低（1-2 天）

---

### 7. 自閉合碰撞過濾 (Self-Collision Filtering)

**現況問題：**
- 相鄰零件可能互相碰撞
- 導致模擬抖動或爆炸

**需要新增：**
- 相鄰零件自動禁用碰撞
- 自定義碰撞過濾群組

**開發工作量：** 🟡 中（2 天）

---

### 8. 視覺 vs 碰撞分離 (Visual/Collision Separation)

**現況問題：**
- 同一個 mesh 用於渲染和碰撞
- 無法使用簡化碰撞幾何

**需要新增：**
- 分別設定 visual mesh 和 collision mesh
- 支援碰撞 mesh 簡化

**開發工作量：** 🟡 中（3 天）

---

### 9. 專案儲存/載入 (Project Save/Load)

**現況問題：**
- 關閉頁面就遺失所有設定
- 無法分多次編輯

**需要新增：**
- 儲存專案為 JSON 檔
- 載入既有專案繼續編輯

**開發工作量：** 🟢 低（1-2 天）

---

### 10. URDF / MJCF 匯出

**現況問題：**
- 只能匯出 USD
- 其他模擬器（Gazebo, MuJoCo）無法使用

**需要新增：**
```
Export Formats:
├── USD / USDA    ✅ 已有
├── URDF          (ROS / Gazebo)
└── MJCF          (MuJoCo)
```

**開發工作量：** 🟡 中（每種格式 2-3 天）

---

## 🟢 進階功能（低優先級）

### 11. 瀏覽器內物理預覽

使用 PhysX.js 或類似方案在瀏覽器中預覽物理

**開發工作量：** 🔴 高（7-10 天）

---

### 12. 感測器定義 (Sensors)

```
Sensor Types:
├── camera        # 攝影機
├── lidar         # 光達
├── contact       # 接觸感測器
├── imu           # 慣性測量單元
└── force_torque  # 力矩感測器
```

**開發工作量：** 🔴 高（每種感測器 2-3 天）

---

### 13. 多 Articulation 支援

一個場景中有多個獨立的 articulation

**開發工作量：** 🟡 中（3 天）

---

### 14. 動作序列預覽

定義關節運動序列，預覽動畫效果

**開發工作量：** 🟡 中（3-4 天）

---

## 📈 建議開發優先順序

### Phase 1: 基礎完善（必要）
**預計時間：2 週**

| 優先級 | 功能 | 工作量 |
|--------|------|--------|
| 1 | 關節限制 (Lower/Upper Limit) | 2 天 |
| 2 | 關節驅動器 (Drive API) | 3 天 |
| 3 | 質量與慣性設定 | 2 天 |
| 4 | 專案儲存/載入 | 1 天 |
| 5 | 碰撞近似（Convex Hull） | 3 天 |

### Phase 2: 使用體驗（重要）
**預計時間：2 週**

| 優先級 | 功能 | 工作量 |
|--------|------|--------|
| 6 | 關節位置編輯器（簡化版） | 3 天 |
| 7 | 材質物理屬性 | 2 天 |
| 8 | 自閉合碰撞過濾 | 2 天 |
| 9 | URDF 匯出 | 3 天 |

### Phase 3: 進階功能（選配）
**預計時間：3+ 週**

| 優先級 | 功能 | 工作量 |
|--------|------|--------|
| 10 | 視覺/碰撞分離 | 3 天 |
| 11 | MJCF 匯出 | 2 天 |
| 12 | 瀏覽器物理預覽 | 7 天 |
| 13 | 感測器定義 | 5+ 天 |

---

## 🎯 總結

### 目前 MVP 能做到的：
✅ 基本的 articulation 結構定義
✅ 可載入 Isaac Sim 且物理可運作
✅ 基本的碰撞偵測

### 要達到「完整 sim-ready」還需要：
⚠️ 關節限制與驅動器（控制用）
⚠️ 質量/慣性自訂（物理準確性）
⚠️ 碰撞近似（效能與穩定性）
⚠️ 關節位置編輯（正確的運動學）

### 建議下一步：
1. 先實作 **關節限制** 和 **驅動器**（最關鍵）
2. 加入 **專案儲存** 功能（使用體驗）
3. 實作 **Convex Hull 碰撞**（穩定性）

這樣就能達到大約 80% 的 sim-ready 完整度！

---

## 📚 參考資料

- [UsdPhysics Schema](https://openusd.org/docs/api/usd_physics_page_front.html)
- [PhysX Schema](https://docs.omniverse.nvidia.com/kit/docs/pxr-usd-api/latest/pxr/PhysxSchema.html)
- [Isaac Sim Asset Reference](https://docs.omniverse.nvidia.com/isaacsim/latest/features/environment_setup/assets/usd_assets_robots.html)

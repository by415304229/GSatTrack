# GSatTrack - 全球卫星跟踪系统

[中文版本](#中文版本) | [English Version](#english-version)

---

## 中文版本

### 项目概述

GSatTrack是一个现代化的全球卫星跟踪系统，提供实时卫星位置追踪、轨道可视化、地面站监控等功能。系统采用React和Three.js构建，提供直观的3D和2D视图，支持多卫星同时跟踪，并具有时间模拟功能。

### 功能特点

- **实时卫星跟踪**: 基于真实TLE（两行元素集）数据的卫星位置计算
- **双视图模式**: 支持3D地球视图和2D地图视图，以及分屏对比模式
- **时间模拟**: 可调节时间流速，支持暂停、快进等功能，便于观察卫星运动轨迹
- **地面站管理**: 添加、删除和管理地面站，查看卫星与地面站的相对位置
- **轨道窗口设置**: 可调节轨道预测时间窗口（1-120分钟）
- **卫星筛选**: 支持按名称或ID搜索卫星，可选择特定卫星进行跟踪
- **响应式设计**: 适配不同屏幕尺寸，提供良好的移动端体验
- **中文本地化**: 完整的中文界面，优化中文字体显示

### 技术栈

- **前端框架**: React 18 + TypeScript
- **3D渲染**: Three.js + React Three Fiber
- **UI组件**: Tailwind CSS + Lucide Icons
- **状态管理**: React Hooks
- **构建工具**: Vite

### 安装步骤

#### 环境要求

- Node.js 18.0 或更高版本
- npm 9.0 或更高版本（或 yarn 1.22.0+）
- 现代浏览器（支持WebGL）

#### 安装依赖

1. 克隆项目到本地：
```bash
git clone https://github.com/your-username/GSatTrack.git
cd GSatTrack
```

2. 安装项目依赖：
```bash
npm install
```

### 使用指南

#### 开发环境运行

1. 启动开发服务器：
```bash
npm run dev
```

2. 打开浏览器访问 `http://localhost:5173`（或终端显示的其他地址）

#### 主要功能使用

1. **视图切换**：
   - 点击界面顶部的"3D"、"2D"或"分屏"按钮切换视图模式

2. **时间控制**：
   - 使用播放/暂停按钮控制时间流动
   - 点击"实时"按钮返回当前时间
   - 使用倍速按钮（1x、10x、100x、1000x）调整时间流速

3. **地面站管理**：
   - 点击"地面站"按钮打开管理面板
   - 输入站点名称、纬度和经度添加新地面站
   - 点击"删除"按钮移除不需要的地面站

4. **卫星筛选**：
   - 点击"设置"按钮打开设置面板
   - 在搜索框中输入卫星名称或ID进行搜索
   - 使用复选框选择要跟踪的卫星
   - 使用"全选"、"取消全选"或"反选"按钮批量操作

5. **轨道窗口设置**：
   - 在设置面板中调整轨道预测时间窗口（1-120分钟）
   - 系统会实时更新轨道轨迹

#### 构建生产版本

```bash
npm run build
```

构建完成后，生产文件将位于 `dist` 目录中。

### 部署方式

#### 静态网站部署

本项目可以部署到任何支持静态网站的托管服务，如：

1. **Vercel部署**：
   - 将项目推送到GitHub仓库
   - 在Vercel中导入项目并自动部署

2. **Netlify部署**：
   - 将项目推送到GitHub仓库
   - 在Netlify中连接GitHub并部署

3. **传统服务器部署**：
   - 构建生产版本：`npm run build`
   - 将 `dist` 目录内容上传到Web服务器

#### 环境要求

- 服务器需要支持HTTPS（某些功能需要安全上下文）
- 服务器需要正确配置MIME类型以支持WebGL和ES模块
- 建议使用支持HTTP/2的服务器以提高加载性能

#### 验证方法

部署完成后，通过以下方式验证：

1. 检查主页面是否正常加载
2. 确认3D地球和2D地图视图正常显示
3. 验证卫星轨道和位置数据是否正确更新
4. 测试时间控制功能是否正常工作
5. 检查地面站管理功能
6. 验证中文界面是否正确显示

### 常见问题

1. **3D视图不显示**：
   - 检查浏览器是否支持WebGL
   - 确保显卡驱动程序是最新的

2. **卫星数据不更新**：
   - 检查网络连接
   - 确认TLE数据源是否可访问

3. **中文显示模糊**：
   - 确保浏览器已加载Noto Sans SC字体
   - 检查浏览器字体渲染设置

---

## English Version

### Project Overview

GSatTrack is a modern global satellite tracking system that provides real-time satellite position tracking, orbit visualization, and ground station monitoring. Built with React and Three.js, the system offers intuitive 3D and 2D views, supports multi-satellite tracking, and includes time simulation features.

### Features

- **Real-time Satellite Tracking**: Satellite position calculation based on real TLE (Two-Line Element Set) data
- **Dual View Modes**: Support for 3D Earth view and 2D map view, as well as split-screen comparison mode
- **Time Simulation**: Adjustable time flow rate with pause, fast-forward functions for observing satellite motion trajectories
- **Ground Station Management**: Add, delete, and manage ground stations, view relative positions between satellites and stations
- **Orbit Window Settings**: Adjustable orbit prediction time window (1-120 minutes)
- **Satellite Filtering**: Search satellites by name or ID, select specific satellites for tracking
- **Responsive Design**: Adapts to different screen sizes, providing a good mobile experience
- **Chinese Localization**: Complete Chinese interface with optimized Chinese font display

### Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **3D Rendering**: Three.js + React Three Fiber
- **UI Components**: Tailwind CSS + Lucide Icons
- **State Management**: React Hooks
- **Build Tool**: Vite

### Installation Steps

#### Environment Requirements

- Node.js 18.0 or higher
- npm 9.0 or higher (or yarn 1.22.0+)
- Modern browser (WebGL support required)

#### Installing Dependencies

1. Clone the project locally:
```bash
git clone https://github.com/your-username/GSatTrack.git
cd GSatTrack
```

2. Install project dependencies:
```bash
npm install
```

### Usage Guide

#### Running in Development Environment

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and visit `http://localhost:5173` (or another address shown in the terminal)

#### Main Feature Usage

1. **View Switching**:
   - Click the "3D", "2D", or "Split" buttons at the top of the interface to switch view modes

2. **Time Control**:
   - Use the play/pause button to control time flow
   - Click the "Live" button to return to current time
   - Use speed buttons (1x, 10x, 100x, 1000x) to adjust time flow rate

3. **Ground Station Management**:
   - Click the "Stations" button to open the management panel
   - Enter station name, latitude, and longitude to add a new ground station
   - Click the "Delete" button to remove unwanted ground stations

4. **Satellite Filtering**:
   - Click the "Settings" button to open the settings panel
   - Enter satellite name or ID in the search box to search
   - Use checkboxes to select satellites to track
   - Use "Select All", "Deselect All", or "Invert Selection" buttons for batch operations

5. **Orbit Window Settings**:
   - Adjust the orbit prediction time window (1-120 minutes) in the settings panel
   - The system will update orbit trajectories in real-time

#### Building for Production

```bash
npm run build
```

After building, the production files will be located in the `dist` directory.

### Deployment Methods

#### Static Website Deployment

This project can be deployed to any hosting service that supports static websites, such as:

1. **Vercel Deployment**:
   - Push the project to a GitHub repository
   - Import the project in Vercel and deploy automatically

2. **Netlify Deployment**:
   - Push the project to a GitHub repository
   - Connect GitHub in Netlify and deploy

3. **Traditional Server Deployment**:
   - Build the production version: `npm run build`
   - Upload the contents of the `dist` directory to a web server

#### Environment Requirements

- Server needs to support HTTPS (some features require a secure context)
- Server needs to correctly configure MIME types to support WebGL and ES modules
- It is recommended to use a server that supports HTTP/2 to improve loading performance

#### Verification Methods

After deployment, verify through the following methods:

1. Check if the main page loads normally
2. Confirm that 3D Earth and 2D map views display correctly
3. Verify that satellite orbit and position data update correctly
4. Test if time control functions work properly
5. Check ground station management functionality
6. Verify that the Chinese interface displays correctly

### Common Issues

1. **3D View Not Displaying**:
   - Check if the browser supports WebGL
   - Ensure graphics card drivers are up to date

2. **Satellite Data Not Updating**:
   - Check network connection
   - Confirm if TLE data source is accessible

3. **Chinese Text Display Blurry**:
   - Ensure the browser has loaded the Noto Sans SC font
   - Check browser font rendering settings

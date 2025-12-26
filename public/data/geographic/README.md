# 地理数据文件说明

## 中国国境线数据

请从以下地址下载中国国境线GeoJSON数据：

**下载地址**: https://geojson.cn/data/atlas/china

### 下载步骤：
1. 访问上面的网址
2. 找到"中国"或"china"相关的完整边界数据
3. 下载GeoJSON格式文件
4. 将文件重命名为 `china-border.geojson`
5. 保存到当前目录 (`public/data/geographic/`)

### 数据格式要求：

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "中国"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [经度, 纬度],
            [经度, 纬度],
            ...
          ]
        ]
      }
    }
  ]
}
```

### 注意事项：

- 确保坐标顺序是 `[经度, 纬度]`（GeoJSON标准）
- 数据应该是完整的国境线边界
- 如果数据包含多个Polygon，选择主边界即可

### 临时测试数据：

如果没有下载数据，系统会显示错误提示。您可以创建一个简单的测试文件来验证功能。

## SAA区域数据

SAA区域不需要下载，系统会根据科学定义自动生成边界坐标。

---

**参考资料**:
- ESA SACS: https://sacs.aeronomie.be/info/saa.php
- GeoJSON格式规范: https://geojson.org/

# Changelog

## [Unreleased]

### Features

- Added TLE file import functionality, supporting drag-and-drop and traditional file selection methods
- Implemented file type validation, accepting only .tle or .txt formats
- Developed TLE content validation module to ensure compliance with TLE data format specifications
- Created data parsing module for structured processing of QIANFAN, SpaceStation, and Starlink satellite data
- Added error handling system with clear guidance for invalid files or formats
- Integrated TLE import functionality into the main application with a dedicated modal interface
- Implemented file-based satellite group data update mechanism, supporting target satellite group selection
- Developed satellite data incremental update logic, supporting both "Override" and "Append" update modes
- Added automatic satellite group recognition for file uploads, automatically matching satellite data to their corresponding groups
- Moved the TLE import button next to the SETTING button to improve user operation convenience
- Enhanced satellite data validation mechanism with checksum verification, orbit parameter reasonableness checks, and satellite data consistency validation

### Bug Fixes

- Fixed an issue in the TLE file upload functionality where only the first satellite data was being processed correctly, ensuring all satellite data can be handled completely and accurately

### Performance Improvements

### Documentation

### Deprecations

## [0.0.1] - YYYY-MM-DD

### Features

### Bug Fixes

### Performance Improvements

### Documentation

### Deprecations
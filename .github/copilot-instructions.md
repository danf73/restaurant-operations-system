<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Restaurant Management System

This is a Node.js-based restaurant management system that provides multiple interfaces for different roles in a restaurant operation:

## System Components

1. **Customer Kiosk** (`/kiosk`) - Self-service ordering interface
2. **Kitchen Display System** (`/kitchen`) - Back-of-house order management for kitchen staff
3. **Assembly Station** (`/assembly`) - Front-of-house order completion and "bump off" system

## Technical Stack

- **Backend**: Node.js with Express.js
- **Real-time Communication**: Socket.IO for live order updates
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Data Storage**: In-memory (can be extended to use SQLite3)

## Key Features

- Real-time order synchronization across all interfaces
- Order status tracking (new → preparing → ready → completed)
- Timer tracking for order preparation times
- Audio notifications for new orders and status changes
- Touch-friendly interfaces optimized for different screen sizes
- Kitchen video screen functionality

## Development Guidelines

- Maintain real-time synchronization using Socket.IO events
- Follow the order workflow: new → preparing → ready → completed
- Use responsive design principles for different device types
- Implement proper error handling for network issues
- Consider accessibility in UI design
- Use consistent color coding across interfaces (red for urgent, green for ready, etc.)

## File Structure

- `server.js` - Main server and API endpoints
- `public/index.html` - Main dashboard for opening different interfaces
- `public/kiosk.html` - Customer ordering interface
- `public/kitchen.html` - Kitchen display system
- `public/assembly.html` - Assembly station for order completion

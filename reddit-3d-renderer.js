/**
 * Reddit 3D Comment Visualization Renderer
 * Pure Three.js implementation for Chrome Extension
 * Adapted from reddit-3d-app
 */

class Reddit3DRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.nodes = [];
    this.edges = [];
    this.nodeMeshes = [];
    this.edgeLines = [];
    this.selectedNode = null;
    this.animationId = null;
    this.clock = new THREE.Clock();

    this.init();
  }

  /**
   * Initialize Three.js scene
   */
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f4f8); // Bright light blue-gray background

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 5);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // Add soft, even lighting for clean look on bright background
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Directional lights for subtle definition without harsh shadows
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight1.position.set(5, 10, 5);
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-5, 5, -5);
    this.scene.add(directionalLight2);

    // Add grid helper with colors suitable for bright background
    const gridHelper = new THREE.GridHelper(50, 50, 0xbfdbfe, 0xdbeafe);
    this.scene.add(gridHelper);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Mouse interaction
    this.setupMouseInteraction();
  }

  /**
   * Setup mouse interaction with orbit and pan controls
   */
  setupMouseInteraction() {
    let mouseDown = false;
    let rightMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let isDragging = false;

    // Camera control state
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.cameraDistance = 8;
    this.cameraTheta = Math.PI / 4;
    this.cameraPhi = Math.PI / 3;

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left button
        mouseDown = true;
      } else if (e.button === 2) { // Right button
        rightMouseDown = true;
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      isDragging = false;
    });

    this.renderer.domElement.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        mouseDown = false;
        // Only trigger click if not dragging
        if (!isDragging) {
          this.onNodeClick(e);
        }
      } else if (e.button === 2) {
        rightMouseDown = false;
      }
    });

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      if (!mouseDown && !rightMouseDown) return;

      const deltaX = e.clientX - mouseX;
      const deltaY = e.clientY - mouseY;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        isDragging = true;
      }

      mouseX = e.clientX;
      mouseY = e.clientY;

      if (mouseDown) {
        // Left mouse: Rotate camera
        this.cameraTheta -= deltaX * 0.01;
        this.cameraPhi -= deltaY * 0.01;

        // Clamp phi to prevent flipping
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));

        this.updateCameraPosition();
      } else if (rightMouseDown) {
        // Right mouse: Pan camera
        const panSpeed = 0.01;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        // Calculate right vector
        right.crossVectors(up, this.camera.position.clone().sub(this.cameraTarget).normalize());
        right.normalize();

        // Pan the target
        this.cameraTarget.add(right.multiplyScalar(-deltaX * panSpeed));
        this.cameraTarget.y += deltaY * panSpeed;

        this.updateCameraPosition();
      }
    });

    // Prevent context menu on right click
    this.renderer.domElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Mouse wheel for zoom
    this.renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.001;
      this.cameraDistance *= (1 + delta);
      this.cameraDistance = Math.max(2, Math.min(20, this.cameraDistance));
      this.updateCameraPosition();
    });
  }

  /**
   * Update camera position based on spherical coordinates
   */
  updateCameraPosition() {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);

    this.camera.position.set(
      this.cameraTarget.x + x,
      this.cameraTarget.y + y,
      this.cameraTarget.z + z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  /**
   * Smoothly move camera to center on a target position
   */
  centerOnPosition(position, duration = 1000) {
    const startTarget = this.cameraTarget.clone();
    const endTarget = new THREE.Vector3(position.x, position.y, position.z);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      this.cameraTarget.lerpVectors(startTarget, endTarget, eased);
      this.updateCameraPosition();

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Handle node click
   */
  onNodeClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(this.nodeMeshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const node = this.nodes.find(n => n.id === clickedMesh.userData.nodeId);
      if (node) {
        this.selectNode(node);
      }
    }
  }

  /**
   * Select a node and highlight it
   */
  selectNode(node) {
    this.selectedNode = node;

    // Center camera on selected node with smooth animation
    this.centerOnPosition(node.position, 800);

    // Update all node materials
    this.nodeMeshes.forEach(mesh => {
      const isSelected = mesh.userData.nodeId === node.id;
      mesh.material.opacity = isSelected ? 1 : mesh.userData.originalOpacity;
      mesh.material.emissive = isSelected ? new THREE.Color(mesh.userData.color) : new THREE.Color(0x000000);
      mesh.material.emissiveIntensity = isSelected ? 0.5 : 0;
    });

    // Dispatch custom event for extension to show node details
    const event = new CustomEvent('nodeSelected', { detail: node });
    window.dispatchEvent(event);
  }

  /**
   * Load graph data and render
   */
  loadGraph(nodes, edges) {
    // Clear existing objects
    this.clear();

    this.nodes = nodes;
    this.edges = edges;

    // Create edges first (so they appear behind nodes)
    this.createEdges();

    // Create nodes
    this.createNodes();

    // Start animation loop
    this.animate();
  }

  /**
   * Create edge lines
   */
  createEdges() {
    this.edges.forEach(edge => {
      const points = [
        new THREE.Vector3(edge.sourcePos.x, edge.sourcePos.y, edge.sourcePos.z),
        new THREE.Vector3(edge.targetPos.x, edge.targetPos.y, edge.targetPos.z)
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x94a3b8, // Slate gray for better visibility on bright background
        transparent: true,
        opacity: 0.4
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      this.edgeLines.push(line);
    });
  }

  /**
   * Create node spheres
   */
  createNodes() {
    this.nodes.forEach(node => {
      const geometry = new THREE.SphereGeometry(1, 32, 32); // More segments for smoother look
      const material = new THREE.MeshPhongMaterial({
        color: node.color,
        transparent: true,
        opacity: node.opacity,
        shininess: 60,
        specular: 0xffffff,
        flatShading: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.position.x, node.position.y, node.position.z);
      mesh.scale.setScalar(node.size);

      // Store node data for interaction
      mesh.userData = {
        nodeId: node.id,
        originalOpacity: node.opacity,
        color: node.color,
        isBranch: isBranchNode(node)
      };

      this.scene.add(mesh);
      this.nodeMeshes.push(mesh);
    });
  }

  /**
   * Animation loop
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // Animate nodes
    this.nodeMeshes.forEach(mesh => {
      // Pulse effect for branch nodes
      if (mesh.userData.isBranch) {
        const pulse = Math.sin(elapsedTime * 2) * 0.1 + 1;
        const baseSize = this.nodes.find(n => n.id === mesh.userData.nodeId)?.size || 0.05;
        mesh.scale.setScalar(baseSize * pulse);
      }

      // Glow effect for selected node
      if (this.selectedNode && mesh.userData.nodeId === this.selectedNode.id) {
        mesh.material.emissiveIntensity = Math.sin(elapsedTime * 3) * 0.3 + 0.7;
      }
    });

    // Auto-spin removed - user can manually rotate with mouse

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Clear all objects from scene
   */
  clear() {
    // Remove all node meshes
    this.nodeMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.nodeMeshes = [];

    // Remove all edge lines
    this.edgeLines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    this.edgeLines = [];

    this.selectedNode = null;
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    if (!this.container.offsetParent) return; // Container not visible

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * Destroy renderer and clean up
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.clear();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    window.removeEventListener('resize', this.onWindowResize);
  }
}

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

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
    pointLight2.position.set(-10, -10, -10);
    this.scene.add(pointLight2);

    // Add grid helper with colors suitable for bright background
    const gridHelper = new THREE.GridHelper(50, 50, 0xbfdbfe, 0xdbeafe);
    this.scene.add(gridHelper);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Mouse interaction
    this.setupMouseInteraction();
  }

  /**
   * Setup mouse interaction (orbit controls simulation)
   */
  setupMouseInteraction() {
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let rotationX = 0;
    let rotationY = 0;

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      mouseDown = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    this.renderer.domElement.addEventListener('mouseup', () => {
      mouseDown = false;
    });

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      if (!mouseDown) return;

      const deltaX = e.clientX - mouseX;
      const deltaY = e.clientY - mouseY;

      mouseX = e.clientX;
      mouseY = e.clientY;

      rotationY += deltaX * 0.005;
      rotationX += deltaY * 0.005;

      // Rotate camera around scene
      const radius = 5;
      this.camera.position.x = radius * Math.sin(rotationY) * Math.cos(rotationX);
      this.camera.position.y = radius * Math.sin(rotationX) + 2;
      this.camera.position.z = radius * Math.cos(rotationY) * Math.cos(rotationX);
      this.camera.lookAt(0, 0, 0);
    });

    // Mouse wheel for zoom
    this.renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.001;
      this.camera.position.multiplyScalar(1 + delta);
    });

    // Click to select node
    this.renderer.domElement.addEventListener('click', (e) => {
      this.onNodeClick(e);
    });
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
      const geometry = new THREE.SphereGeometry(1, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: node.color,
        transparent: true,
        opacity: node.opacity,
        roughness: 0.3,
        metalness: 0.7
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

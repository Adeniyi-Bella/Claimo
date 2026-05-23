import * as THREE from "three";
import type { ViewerGeometryJson } from "../model";

export function createViewerGeometryMesh(
  geometryJson: ViewerGeometryJson,
): THREE.Mesh | null {
  const geoData = geometryJson.data;
  const geo = new THREE.BufferGeometry();
  const { position, normal } = geoData.attributes;

  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(position.array), position.itemSize),
  );

  if (normal) {
    geo.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(normal.array), normal.itemSize),
    );
  } else {
    geo.computeVertexNormals();
  }

  if (geoData.index) {
    geo.setIndex(geoData.index.array);
  }

  geo.computeBoundingBox();
  const box = geo.boundingBox;
  if (!box) return null;

  const center = new THREE.Vector3();
  box.getCenter(center);
  geo.translate(-center.x, -box.min.y, -center.z);

  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: "#6b8cba",
      roughness: 0.45,
      metalness: 0.15,
      side: THREE.DoubleSide,
    }),
  );
}

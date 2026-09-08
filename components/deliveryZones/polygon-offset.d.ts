// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Типы для polygon-offset
//
// Purpose (EN): Minimal ambient type declaration for the untyped
// `polygon-offset` package (used to build a robust outward buffer/offset of
// the real MKAD polygon — see mkadPolygonExpansion.ts).
//
// Назначение (RU): Минимальное объявление типов для нетипизированного пакета
// `polygon-offset` (используется для построения устойчивого buffer/offset
// реального полигона МКАД — см. mkadPolygonExpansion.ts).
// ==================================================
declare module "polygon-offset" {
  type OffsetXY = [number, number];
  type OffsetRing = OffsetXY[];

  export default class Offset {
    constructor(vertices?: OffsetRing, arcSegments?: number);
    data(vertices: OffsetRing): this;
    arcSegments(segments: number): this;
    /** Grows the polygon outward by `distance`. Returns one ring per resulting (non self-intersecting) polygon. */
    margin(distance: number): OffsetRing[];
    /** Shrinks the polygon inward by `distance`. */
    padding(distance: number): OffsetRing[];
    offset(distance: number): OffsetRing[];
  }
}

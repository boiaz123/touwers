/**
 * SpatialGrid - Spatial partitioning for fast proximity queries
 * Divides the game world into fixed-size cells. Entities are inserted
 * into cells each frame, and range queries only check nearby cells
 * instead of all entities. Turns O(N*M) tower targeting into O(N*k).
 */
export class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.invCellSize = 1 / cellSize;
        this.cells = new Map();
        this._cellPool = [];
        this._queryBuf = new Array(256);
    }

    clear() {
        for (const cell of this.cells.values()) {
            cell.length = 0;
            this._cellPool.push(cell);
        }
        this.cells.clear();
    }

    insert(entity) {
        const cx = (entity.x * this.invCellSize) | 0;
        const cy = (entity.y * this.invCellSize) | 0;
        // Bitwise hash: collision-free up to 65,536 cells per axis
        const key = (cx << 16) | (cy & 0xFFFF);
        let cell = this.cells.get(key);
        if (!cell) {
            cell = this._cellPool.length > 0 ? this._cellPool.pop() : [];
            this.cells.set(key, cell);
        }
        cell.push(entity);
    }

    /**
     * Query all entities in cells overlapping the circle (x, y, radius).
     * Returns the count of results; entities stored in this._queryBuf[0..count-1].
     * Note: results include ALL entities in overlapping cells (rectangular area),
     * so callers should still do their own precise distance check.
     */
    query(x, y, radius) {
        const inv = this.invCellSize;
        const minCx = ((x - radius) * inv) | 0;
        const maxCx = ((x + radius) * inv) | 0;
        const minCy = ((y - radius) * inv) | 0;
        const maxCy = ((y + radius) * inv) | 0;

        let count = 0;
        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                const cell = this.cells.get((cx << 16) | (cy & 0xFFFF));
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        // Grow buffer dynamically if needed
                        if (count >= this._queryBuf.length) {
                            this._queryBuf.length = count * 2;
                        }
                        this._queryBuf[count++] = cell[i];
                    }
                }
            }
        }
        return count;
    }
}

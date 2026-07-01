import { Container } from 'pixi.js';

/**
 * Base class for per-entity-type renderer adapters (TowerRenderAdapter,
 * EnemyRenderAdapter, etc - one per subsystem, added in later migration
 * phases). An adapter is the only thing that knows about Pixi for its
 * subsystem: it owns a PixiView per live entity, creates one when an entity
 * is added (tower placed, enemy spawned, ...), destroys it when the entity
 * is removed (sold, killed, expired, ...), and calls each entity's
 * `syncPixiView(pixiView)` once per frame to copy already-computed state
 * onto the view. Adapters never read or branch on game logic themselves.
 */
export class RenderAdapter {
    constructor(parentContainer) {
        this.container = new Container();
        this.container.sortableChildren = true;
        parentContainer.addChild(this.container);

        /** @type {Map<object, import('../PixiView.js').PixiView>} */
        this._views = new Map();
    }

    /**
     * @param {object} entity - the game entity (Tower, BaseEnemy, ...)
     * @param {import('../PixiView.js').PixiView} view
     */
    register(entity, view) {
        this._views.set(entity, view);
        view.addTo(this.container);
        return view;
    }

    unregister(entity) {
        const view = this._views.get(entity);
        if (!view) return;
        view.removeFrom(this.container);
        view.destroy();
        this._views.delete(entity);
    }

    has(entity) {
        return this._views.has(entity);
    }

    get(entity) {
        return this._views.get(entity);
    }

    /** Call every entity's syncPixiView(view) once per frame. Pure state transcription - no logic. */
    syncAll(entities) {
        for (const entity of entities) {
            const view = this._views.get(entity);
            if (view && typeof entity.syncPixiView === 'function') {
                entity.syncPixiView(view);
            }
        }
    }

    clear() {
        for (const entity of Array.from(this._views.keys())) {
            this.unregister(entity);
        }
    }
}

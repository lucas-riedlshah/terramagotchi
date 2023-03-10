import {
    PlantFamilyParticle,
    RootParticle,
    ShootSystemParticle,
    StemParticle,
} from ".";

import {
    AirParticle,
    CompostParticle,
    GrassParticle,
    SoilParticle,
} from "..";

import {
    Environment,
    NUTRIENT_ENERGY_RATIO,
    WATER_ENERGY_RATIO
} from "../../environment";
import { WaterParticle } from "../water";
import { DeadPlantParticle } from "./deadplant";

export class SeedParticle extends PlantFamilyParticle {
    static SEED_MAX_HEALTH = 60*60 // Seeds will use a unique max-health so they don't die immediately

    /**
     * @param {Number}  x           (Integer) x-coordinate of particle to be constructed
     * @param {Number}  y           (Integer) y-coordinate of particle to be constructed
     * @param {DNANode} plant_dna   The DNA-node object for this plant particle. Represents a node in a tree graph.
     */
    constructor(x, y, plant_dna=null) {
        super(x, y, plant_dna);

        this.moveable = true;
        this.weight = 2;
        this.base_color = this.dna.seed_color || "#FF80FF"
        this.pass_through_types = [ ShootSystemParticle ];

        this.activation_level = (this.dna.seed_activation_level != null) ? this.dna.seed_activation_level : 0

        // Minimum energy capacity = the particles activation level, to never not have it as an option
        this.energy_capacity = Math.max(this.energy_capacity, this.activation_level)
        this.max_health = SeedParticle.SEED_MAX_HEALTH
        
        this.germinated = false
    }

    /**
     * Handles update function for the seed particle
     * @param {Environment} environment     The current game environment
     */
    update(environment) {
        this.compute_gravity(environment)
        this.health_update(environment)
        
        this.absorb_from_neighbours(environment, this.__neighbours, [SoilParticle])
        this.generate_energy()

        if (!this.germinated)
            if (this.energy >= this.activation_level)
                this.germinated = true
        
        // Separated out so plant grows
        if (this.germinated)
            this.grow(environment)

        // Increment counter used for reseting environment
        environment.seed_or_first_root_count++;
    }

    /**
     * Handles growing the seed into a stem and root particle if the conditions are correct
     * @param {Environment} environment     The current game environment
    */
    grow(environment) {

        for (let offset of [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]]) {
            if (environment.get(this.x + offset[0], this.y + offset[1] - 1) instanceof RootParticle) {
                environment.set(new DeadPlantParticle(this.x, this.y));
                return;
            }
        }

        if (environment.get(this.x, this.y - 1) instanceof SoilParticle &&
            !(environment.get(this.x, this.y + 1) instanceof AirParticle &&
              environment.get(this.x, this.y + 2) instanceof AirParticle)) {
            environment.set(new DeadPlantParticle(this.x, this.y));
            return;
        }
        if (environment.get(this.x, this.y - 1) instanceof SoilParticle
            && !(environment.get(this.x, this.y - 1) instanceof GrassParticle)) {

            let new_stem_cell = new StemParticle(this.x, this.y, this.dna)
            new_stem_cell.absorb_tier = 1
            
            if (PlantFamilyParticle.IS_NET_ZERO){
                new_stem_cell.nutrient_level += (this.activation_level + this.energy) * NUTRIENT_ENERGY_RATIO
                new_stem_cell.water_level += (this.activation_level + this.energy) * WATER_ENERGY_RATIO
            }

            environment.set(new_stem_cell)
            
            let new_root = new RootParticle(this.x, this.y - 1, this.dna)
            new_root.is_node = true; // makes the first particle a node, for special properties
            new_root.is_first_particle = true; // makes that particle know its the first particle, same reason why
            new_root.parent_root_particle = [this.x, this.y]; // set's it's parent particle as the stem particle spawned by the seed. Used for death code
            environment.set(new_root)
        }
    }

    absorb_water(neighbour) {
        
        // How much water to transfer
        // Absorb as much as the capacity will allow
        let transfer_amount = Math.min(neighbour.water_level, this.water_capacity - this.water_level)

        // Attempt to absorb water from random neighbour
        if (transfer_amount > 0 &&
            !neighbour.__water_transferred &&
            !this.__water_transferred
        ) {
            // Transfer water
            this.water_level += transfer_amount;
            neighbour.water_level -= transfer_amount;

            // Ensure water is not transfered again this tick
            this.__water_transferred = true;
            neighbour.__water_transferred = true;
        }
    }

    absorb_nutrients(neighbour) {

        // How much nutrients to transfer
        // Absorb as much as the capacity will allow
        let transfer_amount = Math.min(neighbour.nutrient_level, this.nutrient_capacity - this.nutrient_level)

        // Attempt to absorb nutrients from random neighbour
        if (transfer_amount > 0 &&
            !neighbour.__nutrient_transferred &&
            !this.__nutrient_transferred
        ) {
            // Transfer nutrients
            this.nutrient_level += transfer_amount;
            neighbour.nutrient_level -= transfer_amount;

            // Ensure nutrients is not transfered again this tick
            this.__nutrient_transferred = true;
            neighbour.__nutrient_transferred = true;
        }
    }
}
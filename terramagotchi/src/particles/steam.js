import { FastRandom } from "../fast-random";
import { CloudParticle } from "./cloud";
import { GasParticle } from "./gas";
import { WaterParticle } from "./water";

export class SteamParticle extends GasParticle {



    constructor(x, y, water_level) {
        super(x, y);
        this.base_color = "#DDD";
        //this.color_variance = 0;
        this.moveable = true;
        this.weight = 0;

        // How much water this particle contains
        this.water_level = water_level;
        // How many ticks the steam particle will take to turn into water
        this.water_condensation_time = 1200;
        // The Y level this steam will convert to a cloud particle
        this.cloud_condensation_height = FastRandom.int_min_max(280, 310);


    }

    update(environment) {
        this.compute_rise(environment);
        this.compute_water_condensation(environment);
        this.compute_cloud_condensation(environment);
    }

    compute_water_condensation(environment) {
        // Countdown timer
        this.water_condensation_time--;
        // Turn steam into water
        if (this.water_condensation_time == 0) {
            let new_water = new WaterParticle(this.x, this.y)
            new_water.water_level = this.water_level;
            environment.set(new_water);
        }
    }

    compute_cloud_condensation(environment) {
        // Convert to cloud at correct height
        if (this.y >= this.cloud_condensation_height) {
            environment.set(new CloudParticle(this.x, this.y, this.water_level, environment));
        }
    }
}
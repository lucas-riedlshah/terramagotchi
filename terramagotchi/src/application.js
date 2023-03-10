import { Environment } from "./environment";
import { initializeApp } from "firebase/app";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, signInAnonymously } from "firebase/auth";

import { FastRandom } from "./fast-random";
import {
    SoilParticle,
    WaterParticle,
    CompostParticle,
} from "./particles";
import { SeedParticle } from "./particles/plants";

export class Application {
    constructor(width = 400, height = 400, instance_id, firebase_config) {
        this.width = width;
        this.height = height;
        this.instance_id = instance_id;
        this.environment = new Environment(width, height);
        this.environment.generate();

        // Initialise firebase and firestore
        this.firebase_app = initializeApp(firebase_config);
        this.db = getFirestore(this.firebase_app);
        signInAnonymously(getAuth(this.firebase_app)); // To keep the firestore secure, authentication is required from the client 
        this.create_instance = httpsCallable(getFunctions(this.firebase_app, "asia-east1"), "userInteract");
        this.initialize_db();
    }

    update() {
        this.environment.update()
        this.environment.refresh()
    }

    initialize_db() {
        // Initialize database varibles and start listening for changes
        this.create_instance({ document: "init", instance_id: this.instance_id }).then((result) => {
            this.db_collection = collection(this.db, this.instance_id);
            this.start_db_listener();
            console.log("Running on instance: " + this.instance_id);
        });
    }

    start_db_listener() {
        // Checks for a new snapshot in the Firestore (a snapshot is created whenever a change occurs in the database)
        onSnapshot(this.db_collection, (snapshot) => {
            // Checks each change in the database snapshot and changes environment as required
            snapshot.docChanges().forEach((change) => {
                if (change.doc.data().value != 0) {
                    if (change.doc.id == "water") {
                        this.environment.user_add_particle(WaterParticle);
                    }
                    if (change.doc.id == "soil") {
                        this.environment.user_add_particle(SoilParticle);
                    }
                    if (change.doc.id == "compost") {
                        this.environment.user_add_particle(CompostParticle);
                    }
                    if (change.doc.id == "seed") {
                        this.environment.user_add_seed(FastRandom.choice(["LAVENDER", "SUNFLOWER", "KAURI"]));
                    }
                    if (change.doc.id == "worm") {
                        this.environment.spawn_organism(FastRandom.int_min_max(5, this.width - 5), FastRandom.int_min_max(160, this.height - 5));
                    }
                    if (change.doc.id == "time") {
                        this.environment.change_time();
                    }
                }
            });
        });
    }
}

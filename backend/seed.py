from database import SessionLocal
from models import Activity, City


cities = [
    {
        "name": "Ahmedabad",
        "country": "India",
        "region": "Asia",
        "cost_index": 0.6,
        "popularity": 85,
        "image_url": "https://images.unsplash.com/photo-1609947017136-9daf32a5eb16",
    },
    {
        "name": "Delhi",
        "country": "India",
        "region": "Asia",
        "cost_index": 0.7,
        "popularity": 92,
        "image_url": "https://images.unsplash.com/photo-1587474260584-136574528ed5",
    },
    {
        "name": "Jaipur",
        "country": "India",
        "region": "Asia",
        "cost_index": 0.6,
        "popularity": 89,
        "image_url": "https://images.unsplash.com/photo-1599661046289-e31897846e41",
    },
    {
        "name": "Bengaluru",
        "country": "India",
        "region": "Asia",
        "cost_index": 0.7,
        "popularity": 84,
        "image_url": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2",
    },
    {
        "name": "Hyderabad",
        "country": "India",
        "region": "Asia",
        "cost_index": 0.6,
        "popularity": 82,
        "image_url": "https://images.unsplash.com/photo-1574169208507-84376144848b",
    },
    {
        "name": "Kochi",
        "country": "India",
        "region": "Asia",
        "cost_index": 0.6,
        "popularity": 86,
        "image_url": "https://images.unsplash.com/photo-1593693397690-362cb9666fc2",
    },
    {
        "name": "Manali",
        "country": "India",
        "region": "Asia",
        "cost_index": 0.5,
        "popularity": 88,
        "image_url": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23",
    },
    {
        "name": "Paris",
        "country": "France",
        "region": "Europe",
        "cost_index": 1.4,
        "popularity": 98,
        "image_url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
    },
    {
        "name": "London",
        "country": "United Kingdom",
        "region": "Europe",
        "cost_index": 1.5,
        "popularity": 96,
        "image_url": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad",
    },
    {
        "name": "Rome",
        "country": "Italy",
        "region": "Europe",
        "cost_index": 1.2,
        "popularity": 94,
        "image_url": "https://images.unsplash.com/photo-1552832230-c0197dd311b5",
    },
    {
        "name": "Amsterdam",
        "country": "Netherlands",
        "region": "Europe",
        "cost_index": 1.4,
        "popularity": 92,
        "image_url": "https://images.unsplash.com/photo-1534351590666-13e3e96b5017",
    },
    {
        "name": "Tokyo",
        "country": "Japan",
        "region": "Asia",
        "cost_index": 1.3,
        "popularity": 97,
        "image_url": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf",
    },
    {
        "name": "Dubai",
        "country": "United Arab Emirates",
        "region": "Middle East",
        "cost_index": 1.6,
        "popularity": 95,
        "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c",
    },
    {
        "name": "Goa",
        "country": "India",
        "region": "Asia",
        "cost_index": 0.6,
        "popularity": 90,
        "image_url": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2",
    },
    {
        "name": "Mumbai",
        "country": "India",
        "region": "Asia",
        "cost_index": 0.7,
        "popularity": 88,
        "image_url": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f",
    },
]


activities = {
    "Ahmedabad": [
        (
            "Sabarmati Ashram",
            "Visit the historic ashram associated with Mahatma Gandhi.",
            "History",
            2,
            0,
        ),
        (
            "Adalaj Stepwell",
            "Explore the beautifully carved historic stepwell near Ahmedabad.",
            "History",
            1.5,
            5,
        ),
        (
            "Kankaria Lake",
            "Enjoy recreation and sightseeing around Ahmedabad's famous lake.",
            "Leisure",
            3,
            5,
        ),
    ],
    "Delhi": [
        (
            "India Gate",
            "Visit Delhi's iconic war memorial and landmark.",
            "Sightseeing",
            1.5,
            0,
        ),
        (
            "Red Fort",
            "Explore the historic Mughal-era fort.",
            "History",
            2.5,
            5,
        ),
        (
            "Humayun's Tomb",
            "Visit the UNESCO World Heritage monument.",
            "Culture",
            2,
            5,
        ),
    ],
    "Jaipur": [
        (
            "Amber Fort",
            "Explore the famous hilltop fort near Jaipur.",
            "History",
            3,
            10,
        ),
        (
            "Hawa Mahal",
            "Visit Jaipur's iconic Palace of Winds.",
            "Sightseeing",
            1.5,
            5,
        ),
        (
            "City Palace",
            "Explore Jaipur's royal palace complex.",
            "Culture",
            2,
            8,
        ),
    ],
    "Bengaluru": [
        (
            "Lalbagh Botanical Garden",
            "Explore Bengaluru's famous botanical garden.",
            "Leisure",
            2,
            2,
        ),
        (
            "Bangalore Palace",
            "Visit the historic royal palace.",
            "History",
            2,
            8,
        ),
        (
            "Cubbon Park",
            "Relax in the city's popular green space.",
            "Leisure",
            2,
            0,
        ),
    ],
    "Hyderabad": [
        (
            "Charminar",
            "Visit Hyderabad's iconic monument.",
            "Sightseeing",
            1.5,
            2,
        ),
        (
            "Golconda Fort",
            "Explore the historic fort and its architecture.",
            "History",
            3,
            5,
        ),
        (
            "Ramoji Film City",
            "Experience one of the world's largest film studio complexes.",
            "Entertainment",
            6,
            20,
        ),
    ],
    "Kochi": [
        (
            "Fort Kochi",
            "Explore the historic streets and colonial architecture.",
            "Culture",
            2,
            0,
        ),
        (
            "Chinese Fishing Nets",
            "See Kochi's famous traditional fishing nets.",
            "Sightseeing",
            1,
            0,
        ),
        (
            "Mattancherry Palace",
            "Visit the historic palace and museum.",
            "History",
            1.5,
            2,
        ),
    ],
    "Manali": [
        (
            "Solang Valley",
            "Enjoy mountain views and adventure activities.",
            "Adventure",
            4,
            15,
        ),
        (
            "Hadimba Temple",
            "Visit the famous wooden temple surrounded by cedar forests.",
            "Culture",
            1.5,
            0,
        ),
        (
            "Rohtang Pass",
            "Experience the scenic high-altitude mountain pass.",
            "Adventure",
            6,
            20,
        ),
    ],
    "Paris": [
        (
            "Eiffel Tower",
            "Sightseeing at the iconic Eiffel Tower.",
            "Sightseeing",
            2,
            25,
        ),
        (
            "Louvre Museum",
            "Explore one of the world's most famous museums.",
            "Culture",
            3,
            20,
        ),
        (
            "Seine River Cruise",
            "Relaxing cruise along the River Seine.",
            "Leisure",
            2,
            30,
        ),
    ],
    "London": [
        (
            "Tower Bridge",
            "Visit London's iconic historic bridge.",
            "Sightseeing",
            1.5,
            15,
        ),
        (
            "British Museum",
            "Explore world history and culture.",
            "Culture",
            3,
            0,
        ),
        (
            "London Eye",
            "Panoramic views across central London.",
            "Sightseeing",
            1.5,
            35,
        ),
    ],
    "Rome": [
        (
            "Colosseum",
            "Explore the ancient Roman amphitheatre.",
            "History",
            2.5,
            25,
        ),
        (
            "Trevi Fountain",
            "Visit the famous Baroque fountain.",
            "Sightseeing",
            1,
            0,
        ),
        (
            "Vatican Museums",
            "Explore world-famous art and historical collections.",
            "Culture",
            3,
            30,
        ),
    ],
    "Amsterdam": [
        (
            "Canal Cruise",
            "Cruise through Amsterdam's historic canals.",
            "Leisure",
            2,
            25,
        ),
        (
            "Rijksmuseum",
            "Explore Dutch art and history.",
            "Culture",
            3,
            25,
        ),
        (
            "Vondelpark",
            "Relax and explore Amsterdam's famous urban park.",
            "Leisure",
            2,
            0,
        ),
    ],
    "Tokyo": [
        (
            "Tokyo Skytree",
            "Enjoy panoramic views of Tokyo.",
            "Sightseeing",
            2,
            20,
        ),
        (
            "Senso-ji Temple",
            "Visit Tokyo's historic Buddhist temple.",
            "Culture",
            2,
            0,
        ),
        (
            "Shibuya Crossing",
            "Experience one of Tokyo's most famous landmarks.",
            "Sightseeing",
            1,
            0,
        ),
    ],
    "Dubai": [
        (
            "Burj Khalifa",
            "Visit the world's tallest building.",
            "Sightseeing",
            2,
            45,
        ),
        (
            "Desert Safari",
            "Experience dune bashing and desert activities.",
            "Adventure",
            6,
            60,
        ),
        (
            "Dubai Marina Cruise",
            "Enjoy a scenic cruise around Dubai Marina.",
            "Leisure",
            2,
            35,
        ),
    ],
    "Goa": [
        (
            "Baga Beach",
            "Relax and enjoy Goa's famous coastline.",
            "Leisure",
            3,
            0,
        ),
        (
            "Fort Aguada",
            "Explore a historic Portuguese fort.",
            "History",
            2,
            5,
        ),
        (
            "Dudhsagar Falls",
            "Visit one of Goa's most famous waterfalls.",
            "Adventure",
            6,
            20,
        ),
    ],
    "Mumbai": [
        (
            "Gateway of India",
            "Visit Mumbai's iconic waterfront monument.",
            "Sightseeing",
            1.5,
            0,
        ),
        (
            "Elephanta Caves",
            "Explore ancient rock-cut cave temples.",
            "History",
            4,
            10,
        ),
        (
            "Marine Drive",
            "Enjoy the famous Mumbai seafront.",
            "Leisure",
            2,
            0,
        ),
    ],
}


def seed_database():
    db = SessionLocal()

    try:
        # Store existing cities by name so the script can be run multiple times.
        existing_cities = {
            city.name: city
            for city in db.query(City).all()
        }

        # Add only cities that are not already present.
        for city_data in cities:
            city_name = city_data["name"]

            if city_name not in existing_cities:
                city = City(**city_data)
                db.add(city)
                existing_cities[city_name] = city

        # Flush so newly created cities receive their IDs.
        db.flush()

        # Add activities only if the same activity doesn't already exist
        # for that city.
        added_activities = 0

        for city_name, city_activities in activities.items():
            city = existing_cities.get(city_name)

            if not city:
                print(f"Warning: city '{city_name}' not found.")
                continue

            existing_activity_names = {
                activity.name
                for activity in city.activities
            }

            for (
                name,
                description,
                category,
                duration,
                cost,
            ) in city_activities:

                if name in existing_activity_names:
                    continue

                activity = Activity(
                    city_id=city.id,
                    name=name,
                    description=description,
                    category=category,
                    duration_hours=duration,
                    estimated_cost=cost,
                )

                db.add(activity)
                added_activities += 1

        db.commit()

        print("Seed completed successfully.")
        print(f"Cities available: {len(existing_cities)}")
        print(f"New activities added: {added_activities}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
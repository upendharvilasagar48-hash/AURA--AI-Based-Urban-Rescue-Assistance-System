"""Hyderabad Geospatial Datasets for AURA Prototype"""
import math

def haversine_distance(coord1: tuple[float, float], coord2: tuple[float, float]) -> float:
    """Calculate distance in meters between two lat/lng coordinates."""
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

# Key Landmarks & Waypoints in Hyderabad (Boduppal to Secunderabad Corridor)
LANDMARKS = {
    "BODUPPAL_DEPOT": {"name": "Boduppal Emergency Station", "lat": 17.4135, "lng": 78.5786, "zone": "Base"},
    "BODUPPAL_X_ROADS": {"name": "Boduppal X-Roads Junction", "lat": 17.4095, "lng": 78.5685, "zone": "Corridor"},
    "UPPAL_CIRCLE": {"name": "Uppal Ring Road Junction (J-1)", "lat": 17.4019, "lng": 78.5602, "zone": "Junction"},
    "UPPAL_METRO": {"name": "Uppal Metro Station", "lat": 17.4058, "lng": 78.5530, "zone": "Corridor"},
    "HABSIGUDA_METRO": {"name": "Habsiguda Metro Junction (J-2)", "lat": 17.4172, "lng": 78.5412, "zone": "Junction"},
    "NGRI_HUB": {"name": "NGRI Metro / Habsiguda Hub", "lat": 17.4225, "lng": 78.5360, "zone": "Corridor"},
    "TARNAKA_JUNCTION": {"name": "Tarnaka Flyover Junction (J-3)", "lat": 17.4278, "lng": 78.5303, "zone": "Junction"},
    "LALAGUDA_X_ROADS": {"name": "Lalaguda Rail Overbridge", "lat": 17.4338, "lng": 78.5205, "zone": "Corridor"},
    "RAIL_NILAYAM": {"name": "Rail Nilayam / Sitafalmandi Hub", "lat": 17.4385, "lng": 78.5115, "zone": "Corridor"},
    "PATIENT_LOCATION": {"name": "Secunderabad Station Triage Point", "lat": 17.4411, "lng": 78.5015, "zone": "Pickup"}
}

# Primary Route (Normal Route: Boduppal -> Uppal -> Habsiguda -> Tarnaka -> Secunderabad)
PRIMARY_ROUTE_TO_PATIENT = [
    {"name": "Boduppal Depot Start", "lat": 17.4135, "lng": 78.5786, "speed_limit": 50},
    {"name": "Boduppal Main Road", "lat": 17.4115, "lng": 78.5735, "speed_limit": 50},
    {"name": "Boduppal X-Roads", "lat": 17.4095, "lng": 78.5685, "speed_limit": 45},
    {"name": "Uppal Outer Ring Road Approach", "lat": 17.4050, "lng": 78.5640, "speed_limit": 55},
    {"name": "Uppal Circle (Bottleneck Point)", "lat": 17.4019, "lng": 78.5602, "speed_limit": 40},
    {"name": "Uppal Metro Station", "lat": 17.4058, "lng": 78.5530, "speed_limit": 50},
    {"name": "Survey of India Corridor", "lat": 17.4110, "lng": 78.5470, "speed_limit": 50},
    {"name": "Habsiguda Metro Junction", "lat": 17.4172, "lng": 78.5412, "speed_limit": 45},
    {"name": "NGRI Metro", "lat": 17.4225, "lng": 78.5360, "speed_limit": 50},
    {"name": "Tarnaka Flyover Base", "lat": 17.4255, "lng": 78.5330, "speed_limit": 50},
    {"name": "Tarnaka Junction Hub", "lat": 17.4278, "lng": 78.5303, "speed_limit": 45},
    {"name": "Mettuguda Flyover Entrance", "lat": 17.4310, "lng": 78.5255, "speed_limit": 55},
    {"name": "Lalaguda Overbridge", "lat": 17.4338, "lng": 78.5205, "speed_limit": 50},
    {"name": "Rail Nilayam South", "lat": 17.4385, "lng": 78.5115, "speed_limit": 45},
    {"name": "Secunderabad Patient Pickup Point", "lat": 17.4411, "lng": 78.5015, "speed_limit": 40}
]

# Alternate Bypass Route (Used when Uppal Circle has heavy congestion)
# Bypasses Uppal via Mallapur / Nacharam Industrial Corridor to Habsiguda / Tarnaka
ALTERNATE_ROUTE_TO_PATIENT = [
    {"name": "Boduppal Depot Start", "lat": 17.4135, "lng": 78.5786, "speed_limit": 50},
    {"name": "Mallapur Link Road", "lat": 17.4190, "lng": 78.5720, "speed_limit": 55},
    {"name": "Nacharam Industrial Area Bypass", "lat": 17.4260, "lng": 78.5620, "speed_limit": 60},
    {"name": "Nacharam IDA X-Roads", "lat": 17.4285, "lng": 78.5520, "speed_limit": 50},
    {"name": "Habsiguda North Link (Bypassed Uppal)", "lat": 17.4240, "lng": 78.5420, "speed_limit": 55},
    {"name": "Tarnaka Junction Hub", "lat": 17.4278, "lng": 78.5303, "speed_limit": 50},
    {"name": "Mettuguda Flyover Entrance", "lat": 17.4310, "lng": 78.5255, "speed_limit": 55},
    {"name": "Lalaguda Overbridge", "lat": 17.4338, "lng": 78.5205, "speed_limit": 50},
    {"name": "Rail Nilayam South", "lat": 17.4385, "lng": 78.5115, "speed_limit": 45},
    {"name": "Secunderabad Patient Pickup Point", "lat": 17.4411, "lng": 78.5015, "speed_limit": 40}
]

# Route from Patient (Secunderabad) to Hospitals
ROUTE_PATIENT_TO_GANDHI_HOSPITAL = [
    {"name": "Secunderabad Patient Pickup Point", "lat": 17.4411, "lng": 78.5015, "speed_limit": 40},
    {"name": "St. Ann's High School Road", "lat": 17.4360, "lng": 78.5020, "speed_limit": 45},
    {"name": "Sangeeth Junction", "lat": 17.4320, "lng": 78.5025, "speed_limit": 40},
    {"name": "Padmarao Nagar Main Road", "lat": 17.4280, "lng": 78.5030, "speed_limit": 45},
    {"name": "Musheerabad Crossroads", "lat": 17.4255, "lng": 78.5032, "speed_limit": 40},
    {"name": "Gandhi Hospital Emergency Trauma Bay", "lat": 17.4241, "lng": 78.5034, "speed_limit": 30}
]

ROUTE_PATIENT_TO_YASHODA = [
    {"name": "Secunderabad Patient Pickup Point", "lat": 17.4411, "lng": 78.5015, "speed_limit": 40},
    {"name": "Alexander Road", "lat": 17.4425, "lng": 78.4998, "speed_limit": 45},
    {"name": "Yashoda Hospital Emergency Center", "lat": 17.4435, "lng": 78.4982, "speed_limit": 30}
]

ROUTE_PATIENT_TO_KIMS = [
    {"name": "Secunderabad Patient Pickup Point", "lat": 17.4411, "lng": 78.5015, "speed_limit": 40},
    {"name": "MG Road Corridor", "lat": 17.4395, "lng": 78.4940, "speed_limit": 45},
    {"name": "Minister Road Junction", "lat": 17.4388, "lng": 78.4900, "speed_limit": 40},
    {"name": "KIMS Hospital Trauma Complex", "lat": 17.4385, "lng": 78.4875, "speed_limit": 30}
]

# Destination Hospitals in Hyderabad
HOSPITALS = {
    "HOSP-GANDHI": {
        "id": "HOSP-GANDHI",
        "name": "Gandhi Hospital & Emergency Trauma Care",
        "locality": "Musheerabad, Secunderabad",
        "lat": 17.4241,
        "lng": 78.5034,
        "type": "Level-1 Government Trauma Center",
        "emergency_beds_available": 14,
        "icu_beds_available": 5,
        "trauma_team_status": "STANDBY",
        "distance_from_patient_km": 2.1,
        "normal_eta_min": 6
    },
    "HOSP-YASHODA": {
        "id": "HOSP-YASHODA",
        "name": "Yashoda Hospital Secunderabad",
        "locality": "Alexander Road, Secunderabad",
        "lat": 17.4435,
        "lng": 78.4982,
        "type": "Comprehensive Cardiac & Trauma Center",
        "emergency_beds_available": 8,
        "icu_beds_available": 3,
        "trauma_team_status": "READY",
        "distance_from_patient_km": 0.8,
        "normal_eta_min": 3
    },
    "HOSP-KIMS": {
        "id": "HOSP-KIMS",
        "name": "KIMS Hospital Secunderabad",
        "locality": "Minister Road, Secunderabad",
        "lat": 17.4385,
        "lng": 78.4875,
        "type": "Multi-Specialty Emergency Hospital",
        "emergency_beds_available": 12,
        "icu_beds_available": 4,
        "trauma_team_status": "STANDBY",
        "distance_from_patient_km": 1.9,
        "normal_eta_min": 5
    },
    "HOSP-APOLLO": {
        "id": "HOSP-APOLLO",
        "name": "Apollo Hospitals Jubilee Hills",
        "locality": "Road No 72, Jubilee Hills",
        "lat": 17.4258,
        "lng": 78.4116,
        "type": "Super-Specialty Quaternary Care & Trauma",
        "emergency_beds_available": 16,
        "icu_beds_available": 6,
        "trauma_team_status": "READY",
        "distance_from_patient_km": 10.2,
        "normal_eta_min": 14
    },
    "HOSP-NIMS": {
        "id": "HOSP-NIMS",
        "name": "Nizam's Institute of Medical Sciences (NIMS)",
        "locality": "Punjagutta, Hyderabad",
        "lat": 17.4218,
        "lng": 78.4533,
        "type": "State Autonomous Apex Trauma Center",
        "emergency_beds_available": 20,
        "icu_beds_available": 8,
        "trauma_team_status": "READY",
        "distance_from_patient_km": 6.8,
        "normal_eta_min": 10
    },
    "HOSP-CARE": {
        "id": "HOSP-CARE",
        "name": "CARE Hospitals Banjara Hills",
        "locality": "Road No 1, Banjara Hills",
        "lat": 17.4145,
        "lng": 78.4485,
        "type": "Comprehensive Cardiac & Trauma Hospital",
        "emergency_beds_available": 10,
        "icu_beds_available": 4,
        "trauma_team_status": "STANDBY",
        "distance_from_patient_km": 7.4,
        "normal_eta_min": 11
    },
    "HOSP-OSMANIA": {
        "id": "HOSP-OSMANIA",
        "name": "Osmania General Hospital",
        "locality": "Afzal Gunj, Old City",
        "lat": 17.3785,
        "lng": 78.4755,
        "type": "Government Apex Emergency Hospital",
        "emergency_beds_available": 25,
        "icu_beds_available": 10,
        "trauma_team_status": "READY",
        "distance_from_patient_km": 8.5,
        "normal_eta_min": 12
    }
}

# Major Traffic Junctions on the corridor
TRAFFIC_JUNCTIONS = {
    "J1_UPPAL": {
        "id": "J1_UPPAL",
        "name": "Uppal Ring Road Crossroads (J-1)",
        "lat": 17.4019,
        "lng": 78.5602,
        "congestion_level": "MODERATE",  # NORMAL, MODERATE, HEAVY, GRIDLOCK
        "congestion_index": 45,          # 0 to 100
        "green_corridor_active": False,
        "traffic_police_station": "Uppal Traffic PS",
        "delay_minutes": 2.5
    },
    "J2_HABSIGUDA": {
        "id": "J2_HABSIGUDA",
        "name": "Habsiguda Metro Junction (J-2)",
        "lat": 17.4172,
        "lng": 78.5412,
        "congestion_level": "NORMAL",
        "congestion_index": 20,
        "green_corridor_active": False,
        "traffic_police_station": "Gopalapuram / Habsiguda Sector",
        "delay_minutes": 0.5
    },
    "J3_TARNAKA": {
        "id": "J3_TARNAKA",
        "name": "Tarnaka Flyover Hub (J-3)",
        "lat": 17.4278,
        "lng": 78.5303,
        "congestion_level": "NORMAL",
        "congestion_index": 25,
        "green_corridor_active": False,
        "traffic_police_station": "Tarnaka Traffic Post",
        "delay_minutes": 1.0
    },
    "J4_SANGEETH": {
        "id": "J4_SANGEETH",
        "name": "Sangeeth Crossroads (J-4)",
        "lat": 17.4320,
        "lng": 78.5025,
        "congestion_level": "NORMAL",
        "congestion_index": 30,
        "green_corridor_active": False,
        "traffic_police_station": "Secunderabad Traffic Division",
        "delay_minutes": 1.2
    }
}

# Connected Devices & Road Users for 50-meter Alert Demonstration
# Note the crucial distinction:
# is_on_road = True -> Connected Road User / Moving Vehicle (MUST BE ALERTED)
# is_on_road = False -> Device inside residential building / shop (MUST BE FILTERED OUT)
SIMULATED_CONNECTED_DEVICES = [
    {
        "device_id": "V-101-CAR",
        "label": "TS-08-EV-2024 (Hyundai Ioniq)",
        "lat": 17.4022,
        "lng": 78.5599,
        "is_on_road": True,
        "device_type": "CONNECTED_VEHICLE",
        "lane": "Right / Fast Lane",
        "road_name": "Uppal Crossroads Approach",
        "driver_name": "R. Sharma",
        "alert_status": "NONE"
    },
    {
        "device_id": "BLD-APT-UPPAL",
        "label": "Apartment 304, Sneha Enclave",
        "lat": 17.4021,
        "lng": 78.5604,
        "is_on_road": False,
        "device_type": "OFF_ROAD_BUILDING",
        "building_name": "Sneha Enclave Residential",
        "road_name": "Off-Street (18m away from carriageway)",
        "driver_name": "Resident Smartphone",
        "alert_status": "FILTERED_OUT_BUILDING"
    },
    {
        "device_id": "V-102-CAR",
        "label": "TS-07-UA-8891 (Honda City)",
        "lat": 17.4170,
        "lng": 78.5415,
        "is_on_road": True,
        "device_type": "CONNECTED_VEHICLE",
        "lane": "Center Lane",
        "road_name": "Habsiguda Main Road",
        "driver_name": "K. Venkatesh",
        "alert_status": "NONE"
    },
    {
        "device_id": "BLD-CAFE-HAB",
        "label": "Table 4, Minerva Coffee Shop",
        "lat": 17.4173,
        "lng": 78.5416,
        "is_on_road": False,
        "device_type": "OFF_ROAD_BUILDING",
        "building_name": "Minerva Commercial Complex",
        "road_name": "Inside Building Ground Floor",
        "driver_name": "Patron Phone",
        "alert_status": "FILTERED_OUT_BUILDING"
    },
    {
        "device_id": "V-103-BUS",
        "label": "TSRTC Electric Metro Bus #3H",
        "lat": 17.4275,
        "lng": 78.5305,
        "is_on_road": True,
        "device_type": "COMMERCIAL_VEHICLE",
        "lane": "Left Bus Lane",
        "road_name": "Tarnaka Hub Service Rd",
        "driver_name": "M. Yadaiah",
        "alert_status": "NONE"
    },
    {
        "device_id": "BLD-OFFICE-TAR",
        "label": "Level 3, Tarnaka IT Towers",
        "lat": 17.4280,
        "lng": 78.5307,
        "is_on_road": False,
        "device_type": "OFF_ROAD_BUILDING",
        "building_name": "Tarnaka IT Towers",
        "road_name": "Inside Highrise Office",
        "driver_name": "Office Employee Device",
        "alert_status": "FILTERED_OUT_BUILDING"
    },
    {
        "device_id": "V-104-BIKE",
        "label": "TS-09-CD-1120 (Royal Enfield)",
        "lat": 17.4335,
        "lng": 78.5210,
        "is_on_road": True,
        "device_type": "TWO_WHEELER",
        "lane": "Right Lane",
        "road_name": "Lalaguda Rail Overbridge",
        "driver_name": "A. Srinivas",
        "alert_status": "NONE"
    },
    {
        "device_id": "V-105-AMB-NEARBY",
        "label": "TS-10-UB-9901 (Private Ambulance)",
        "lat": 17.4380,
        "lng": 78.5120,
        "is_on_road": True,
        "device_type": "CONNECTED_VEHICLE",
        "lane": "Left Lane",
        "road_name": "Sitafalmandi Road",
        "driver_name": "P. Naresh",
        "alert_status": "NONE"
    }
]

# Patient Demo Profile
DEFAULT_PATIENT = {
    "patient_id": "PT-HYD-772",
    "name": "Rajeshwar Rao",
    "age": 62,
    "gender": "Male",
    "location_name": "Secunderabad Rail Nilayam Entrance",
    "lat": 17.4411,
    "lng": 78.5015,
    "condition": "Severe Acute Chest Pain, Suspected Myocardial Infarction",
    "triage_priority": "CRITICAL_CODE_RED",
    "vitals": {
        "heart_rate_bpm": 138,
        "blood_pressure": "88/56 mmHg",
        "spo2_percent": 91,
        "respiratory_rate": 26
    },
    "reporting_party": "Relative (S. Rao) via 108 Dispatch"
}

# Ambulance Demo Profile
DEFAULT_AMBULANCE = {
    "ambulance_id": "AMB-108-HYD",
    "call_sign": "AURA-DELTA-1",
    "model": "Force Motors Advanced Life Support (ALS)",
    "equipment": ["Automated Defibrillator", "Mechanical Ventilator", "Multipara Monitor", "AURA Agent Core"],
    "paramedic_name": "Dr. Praneeth & Paramedic Swathi",
    "driver_name": "Surender Reddy",
    "base_station": "Boduppal Emergency Station"
}

# Hyderabad Preset Patient Pickup Locations
HYDERABAD_PICKUP_PRESETS = [
    {
        "id": "PICKUP-BODUPPAL",
        "name": "Boduppal X Roads Junction",
        "locality": "Boduppal, Medchal-Malkajgiri",
        "lat": 17.4095,
        "lng": 78.5685,
        "landmark": "Near Asian Shiva Ganga Theatre"
    },
    {
        "id": "PICKUP-UPPAL-METRO",
        "name": "Uppal Ring Road & Metro Station",
        "locality": "Uppal, East Zone",
        "lat": 17.4019,
        "lng": 78.5602,
        "landmark": "Metro Pillar 948, Uppal Junction"
    },
    {
        "id": "PICKUP-HABSIGUDA",
        "name": "Habsiguda Crossroads (J-2)",
        "locality": "Habsiguda",
        "lat": 17.4172,
        "lng": 78.5412,
        "landmark": "Near NGRI Metro Gate 1"
    },
    {
        "id": "PICKUP-TARNAKA",
        "name": "Tarnaka Flyover Hub (J-3)",
        "locality": "Tarnaka, Secunderabad",
        "lat": 17.4278,
        "lng": 78.5303,
        "landmark": "Tarnaka Metro Pillar 1102"
    },
    {
        "id": "PICKUP-SECUNDERABAD",
        "name": "Secunderabad Rail Nilayam Entrance",
        "locality": "Secunderabad Station",
        "lat": 17.4411,
        "lng": 78.5015,
        "landmark": "South Central Railway HQ / Platform 10"
    },
    {
        "id": "PICKUP-BEGUMPET",
        "name": "Begumpet Airport Road",
        "locality": "Begumpet, Central Zone",
        "lat": 17.4440,
        "lng": 78.4680,
        "landmark": "Opposite Lifestyle Building"
    },
    {
        "id": "PICKUP-BANJARA",
        "name": "Banjara Hills Road No 1",
        "locality": "Banjara Hills, West Zone",
        "lat": 17.4156,
        "lng": 78.4350,
        "landmark": "Near Care Hospital / City Center Mall"
    },
    {
        "id": "PICKUP-HITEC",
        "name": "Hitec City Cyber Towers",
        "locality": "Madhapur, Cyberabad",
        "lat": 17.4504,
        "lng": 78.3808,
        "landmark": "Cyber Gateway Main Entrance"
    }
]

def generate_corridor_waypoints(start_lat: float, start_lng: float, end_lat: float, end_lng: float, end_name: str = "Destination") -> list[dict]:
    """Generates realistic navigation waypoints between any start and end coordinates in Hyderabad."""
    total_dist = haversine_distance((start_lat, start_lng), (end_lat, end_lng))
    # If distance is short (< 300m), return start and end
    if total_dist < 300:
        return [
            {"name": "Current Location", "lat": round(start_lat, 6), "lng": round(start_lng, 6), "speed_limit": 45},
            {"name": end_name, "lat": round(end_lat, 6), "lng": round(end_lng, 6), "speed_limit": 35}
        ]
    
    # Determine number of intermediate steps based on distance (roughly every 600m)
    num_steps = max(3, min(12, int(total_dist / 600.0)))
    waypoints = [{"name": "Current Location", "lat": round(start_lat, 6), "lng": round(start_lng, 6), "speed_limit": 50}]
    
    all_landmarks = list(LANDMARKS.values())
    
    for i in range(1, num_steps):
        t = i / float(num_steps)
        interp_lat = start_lat + (end_lat - start_lat) * t
        interp_lng = start_lng + (end_lng - start_lng) * t
        
        # Check if a landmark is close to this interpolated point (< 700m)
        snapped_name = None
        for lm in all_landmarks:
            if haversine_distance((interp_lat, interp_lng), (lm["lat"], lm["lng"])) < 700.0:
                snapped_name = lm["name"]
                interp_lat = (interp_lat * 0.4) + (lm["lat"] * 0.6)
                interp_lng = (interp_lng * 0.4) + (lm["lng"] * 0.6)
                break
                
        wp_name = snapped_name or f"Corridor Segment {i} ({int(t*100)}%)"
        waypoints.append({
            "name": wp_name,
            "lat": round(interp_lat, 6),
            "lng": round(interp_lng, 6),
            "speed_limit": 50 if i < num_steps - 1 else 40
        })
        
    waypoints.append({
        "name": end_name,
        "lat": round(end_lat, 6),
        "lng": round(end_lng, 6),
        "speed_limit": 30
    })
    return waypoints


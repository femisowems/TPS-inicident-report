import { Component, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-picker.html',
  styleUrls: ['./map-picker.css']
})
export class MapPickerComponent implements OnInit {
  @Output() locationSelected = new EventEmitter<{lat: number, lng: number, address: string}>();
  
  private map: any;
  private marker: any;
  private radiusCircle: any; // Visual Smart Zone
  
  searchQuery = signal('');
  suggestions = signal<{lat: number, lng: number, address: string}[]>([]);
  isGeocoding = signal(false);
  
  // Mock Data for Toronto Landmarks
  private mockLocations = [
    { address: 'Toronto City Hall, 100 Queen St W', lat: 43.6534, lng: -79.3841 },
    { address: 'CN Tower, 290 Bremner Blvd', lat: 43.6426, lng: -79.3871 },
    { address: 'Royal Ontario Museum, 100 Queens Park', lat: 43.6677, lng: -79.3948 },
    { address: 'Distillery District, Toronto', lat: 43.6503, lng: -79.3596 },
    { address: 'High Park, Toronto', lat: 43.6465, lng: -79.4637 },
    { address: 'Union Station, 65 Front St W', lat: 43.6453, lng: -79.3806 }
  ];

  ngOnInit() {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [43.6532, -79.3832],
      zoom: 13,
      zoomControl: false
    });

    // Custom Zoom Position
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      await this.reverseGeocode(lat, lng);
    });
  }

  private async reverseGeocode(lat: number, lng: number) {
    this.isGeocoding.set(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await resp.json();
      const address = data.display_name || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      this.searchQuery.set(address);
      this.selectLocation(lat, lng, address);
    } catch (err) {
      this.selectLocation(lat, lng, `Manual: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      this.isGeocoding.set(false);
    }
  }

  onSearchChange() {
    const query = this.searchQuery().toLowerCase();
    if (query.length > 2) {
      this.suggestions.set(
        this.mockLocations.filter(loc => loc.address.toLowerCase().includes(query))
      );
    } else {
      this.suggestions.set([]);
    }
  }

  selectSuggestion(loc: {lat: number, lng: number, address: string}) {
    this.searchQuery.set(loc.address);
    this.suggestions.set([]);
    this.map.flyTo([loc.lat, loc.lng], 17, { duration: 1.5 });
    this.selectLocation(loc.lat, loc.lng, loc.address);
  }

  private selectLocation(lat: number, lng: number, address: string) {
    // Marker Update
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
    }

    // Smart Zone (Radius Circle) Update
    if (this.radiusCircle) {
      this.radiusCircle.setLatLng([lat, lng]);
    } else {
      this.radiusCircle = L.circle([lat, lng], {
        radius: 30,
        color: '#2563eb', // blue-600
        fillColor: '#3b82f6', // blue-500
        fillOpacity: 0.15,
        weight: 1,
        className: 'pulse-circle'
      }).addTo(this.map);
    }
    
    this.locationSelected.emit({ lat, lng, address });
  }
}

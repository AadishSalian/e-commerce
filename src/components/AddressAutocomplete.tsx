'use client';

import React from 'react';
import Autocomplete from 'react-google-autocomplete';

interface AddressAutocompleteProps {
  onAddressSelect: (addressData: {
    address: string;
    city: string;
    zip: string;
  }) => void;
  error?: string;
}

export function AddressAutocomplete({ onAddressSelect, error }: AddressAutocompleteProps) {
  return (
    <div className="w-full">
      <Autocomplete
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        options={{
          types: ['address'],
          componentRestrictions: { country: 'us' }, // can be customized
        }}
        onPlaceSelected={(place) => {
          if (!place || !place.address_components) return;

          let address = '';
          let city = '';
          let zip = '';
          let streetNumber = '';
          let route = '';

          place.address_components.forEach((component) => {
            const types = component.types;
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            }
            if (types.includes('route')) {
              route = component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('postal_code')) {
              zip = component.long_name;
            }
          });

          address = `${streetNumber} ${route}`.trim();
          // Fallback if structured parsing fails
          if (!address) {
            address = place.formatted_address || place.name || '';
          }

          onAddressSelect({ address, city, zip });
        }}
        placeholder="Address (Start typing...)"
        name="address"
        autoComplete="street-address"
        className={`w-full bg-surface border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent'} text-foreground px-4 py-3 rounded-lg focus:outline-none transition-colors`}
        defaultValue=""
      />
    </div>
  );
}

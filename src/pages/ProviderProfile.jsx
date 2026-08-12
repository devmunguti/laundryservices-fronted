import React, { useState } from 'react';

export default function cleanersProfile({ isStandalone = true }) {
  const [profile, setProfile] = useState({
    businessName: 'HydroClean Westlands',
    description: 'Premium dry cleaning and laundry services tailored for the busy professional. We use eco-friendly solvents and guarantee a 24-hour turnaround on most items.',
    building: 'The Mirage Tower, Ground Floor',
    street: 'Chiromo Road',
    location: 'Westlands CBD, Nairobi',
    turnaround: '24 Hours',
    pickup: true,
    delivery: true,
    email: 'hello@hydroclean.co.ke',
    phone: '712 345 678',
    hours: {
      monFri: { active: true, open: '08:00', close: '18:00' },
      saturday: { active: true, open: '09:00', close: '14:00' },
      sunday: { active: false, open: '09:00', close: '17:00' },
    }
  });

  const mainContent = (
    <div className="flex flex-col w-full relative font-['Inter'] text-[#1a1c1e]">
      <div className="grid grid-cols-12 gap-6 md:gap-8">
        {/* Profile Header Section */}
        <section className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          {/* Logo & Main Info Card */}
          <div className="bg-[#f3f3f6] rounded-xl p-6 shadow-xs flex flex-col items-center text-center gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#003ec7]/5 to-transparent opacity-50 z-0"></div>
            <div className="relative z-10 w-32 h-32 rounded-full bg-[#f9f9fc] shadow-md flex items-center justify-center overflow-hidden border-4 border-white transition-transform duration-300 group-hover:scale-105">
              <img
                className="w-full h-full object-cover"
                alt="HydroClean Westlands Logo"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBclo4h3zF7N4eq0phlz6abEPACAmwq_A3WOQROGGkf0RG1-UzbhbgUgGLsJbhhgZCP4cOCVe8KPGDmV-X-OOV2NdG_ENxmyHQ6R2rzaFvK985_O_sPLcOngPwGPvKyRSPCxNh6VQqB0_kfY1Y55iuMKk2SOIPb2V7rx0JPTcXUHPe9Sfn3-FKHPNlHm9O1Pm895jKmI2cVA-PWczSerm9SwAOTNAk0dTS-EloFTtjeUsHJZiTw06ek8g"
              />
              <button className="absolute inset-0 bg-[#2f3133]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                <span className="material-symbols-outlined text-white text-[32px]">photo_camera</span>
              </button>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="font-['Geist'] text-2xl font-semibold text-[#1a1c1e]">{profile.businessName}</h2>
              <p className="font-['Inter'] text-sm text-[#434656] flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[16px] text-[#494e57]">location_on</span>
                {profile.location}
              </p>
              <div className="flex gap-2 mt-4 flex-wrap justify-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#00c1fd] text-[#004b65] font-['Geist'] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Premium Partner
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#e2e2e5] text-[#434656] font-['Geist'] text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  4.8 (124)
                </span>
              </div>
            </div>
          </div>

          {/* Profile Completion Widget */}
          <div className="bg-white rounded-xl p-6 shadow-xs border border-[#c3c5d9]/10">
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-['Geist'] text-lg font-semibold text-[#1a1c1e]">Profile Strength</h3>
              <span className="font-['Geist'] text-sm font-medium text-[#003ec7]">85%</span>
            </div>
            <div className="w-full h-2 bg-[#e2e2e5] rounded-full overflow-hidden">
              <div className="h-full bg-[#0052ff] rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
            </div>
            <p className="font-['Inter'] text-xs text-[#434656] mt-4">
              Add your operational hours to complete your profile and attract more customers.
            </p>
          </div>

          {/* Visual Decorative Element */}
          <div className="hidden xl:block rounded-xl overflow-hidden shadow-xs h-48 relative border border-[#c3c5d9]/10">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#2f3133]/80 via-transparent to-transparent"></div>
            <img
              className="w-full h-full object-cover"
              alt="Facility View"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCImNglt8uxbaXTGDXrlmWEnOUTOqn_-AJzpqdh0irfbV1jZlFxtf7wApUqSeyPSaN25rqNMX6nPpMaICa2Gz4QRhMcynDlhXnzKf01-5buMqVp-aY_8SRAailmLDX-FHP6n052lzOhgOef6K7WTRurpSkZNEJq-Arvah6e7Pn9otCKmBp9P5BMWp4HKuWJz8G29XxGS-WY33WD_rL2m2RtjOD5hpn6sPDhncgi5k5MQ01kT6ZBFWmSSQ"
            />
            <div className="absolute bottom-4 left-4 z-20 text-white">
              <p className="font-['Geist'] text-xs uppercase tracking-wider opacity-80 font-semibold">Facility View</p>
              <p className="font-['Inter'] text-sm font-medium">Main Operations Center</p>
            </div>
          </div>
        </section>

        {/* Forms Section */}
        <section className="col-span-12 xl:col-span-8 flex flex-col gap-6 pb-24">
          {/* Business Information Card */}
          <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-[#c3c5d9]/10">
            <div className="p-6 bg-[#f3f3f6] flex items-center gap-3 border-b border-[#c3c5d9]/20">
              <div className="w-10 h-10 rounded-full bg-[#0052ff] text-white flex items-center justify-center">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <div>
                <h2 className="font-['Geist'] text-lg font-semibold text-[#1a1c1e]">Business Information</h2>
                <p className="font-['Inter'] text-xs text-[#434656]">Core details displayed to customers.</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]" htmlFor="businessName">Business Name</label>
                <input
                  id="businessName"
                  type="text"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  placeholder="Enter business name"
                  className="bg-[#f9f9fc] rounded-lg border border-[#c3c5d9]/30 px-4 py-3 font-['Inter'] text-sm text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#0052ff] focus:bg-white transition-colors shadow-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows={3}
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Describe your services..."
                  className="bg-[#f9f9fc] rounded-lg border border-[#c3c5d9]/30 px-4 py-3 font-['Inter'] text-sm text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#0052ff] focus:bg-white transition-colors shadow-xs resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]">Location / Map Pin</label>
                <div className="relative rounded-lg overflow-hidden h-40 shadow-xs border border-[#c3c5d9]/20">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBTG4fPG5PxOU2GrmqUNRqhrPi2HP2N1oRjqmkfBWwLKYyY7ufyj4WBot2hiNSjdOHL8mgNoO-N1DEy-bPSpXPIubhSNaQIyDrHKHrZy4B-6-8F0WXwbuX3STT_XXJDmbfQ4OTYB3j5-KRSVmErLymUODcIRoIk1OqrQJ-HRKwCnVqtxMGXnM7ythyUEfZJk-u4oDT29EC2RWxgJFWNioyCccm_Ddh86RkO9KRz92cyaxvb5JfX2CXqzw')` }}
                  ></div>
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] rounded-lg"></div>
                  <button
                    type="button"
                    onClick={() => alert('Map Pin adjustment widget opened.')}
                    className="absolute bottom-3 right-3 bg-white text-[#1a1c1e] px-3 py-1.5 rounded-lg shadow-md font-['Geist'] text-xs font-semibold flex items-center gap-1 hover:bg-[#e8e8ea] transition-colors pointer-events-auto cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_location</span> Adjust Pin
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]" htmlFor="building">Building/Complex</label>
                <input
                  id="building"
                  type="text"
                  value={profile.building}
                  onChange={(e) => setProfile({ ...profile, building: e.target.value })}
                  placeholder="e.g. Prism Tower"
                  className="bg-[#f9f9fc] rounded-lg border border-[#c3c5d9]/30 px-4 py-3 font-['Inter'] text-sm text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#0052ff] focus:bg-white transition-colors shadow-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]" htmlFor="street">Street Address</label>
                <input
                  id="street"
                  type="text"
                  value={profile.street}
                  onChange={(e) => setProfile({ ...profile, street: e.target.value })}
                  placeholder="e.g. Waiyaki Way"
                  className="bg-[#f9f9fc] rounded-lg border border-[#c3c5d9]/30 px-4 py-3 font-['Inter'] text-sm text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#0052ff] focus:bg-white transition-colors shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Operational Details Card */}
          <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-[#c3c5d9]/10">
            <div className="p-6 bg-[#f3f3f6] flex items-center gap-3 border-b border-[#c3c5d9]/20">
              <div className="w-10 h-10 rounded-full bg-[#00c1fd] text-[#004b65] flex items-center justify-center">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <h2 className="font-['Geist'] text-lg font-semibold text-[#1a1c1e]">Operational Details</h2>
                <p className="font-['Inter'] text-xs text-[#434656]">Manage when and how you serve customers.</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Turnaround & Delivery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]" htmlFor="turnaround">Standard Turnaround Promise</label>
                  <select
                    id="turnaround"
                    value={profile.turnaround}
                    onChange={(e) => setProfile({ ...profile, turnaround: e.target.value })}
                    className="bg-[#f9f9fc] rounded-lg border border-[#c3c5d9]/30 px-4 py-3 font-['Inter'] text-sm text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#0052ff] focus:bg-white transition-colors shadow-xs cursor-pointer"
                  >
                    <option>Same Day (Expedited)</option>
                    <option>24 Hours</option>
                    <option>48 Hours</option>
                    <option>72+ Hours</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]">Delivery Availability</label>
                  <div className="flex gap-4 h-[48px]">
                    <label className="flex-1 flex items-center gap-2 cursor-pointer bg-[#f9f9fc] border border-[#c3c5d9]/30 px-4 rounded-lg shadow-xs hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.pickup}
                        onChange={(e) => setProfile({ ...profile, pickup: e.target.checked })}
                        className="w-4 h-4 text-[#0052ff] rounded border-[#c3c5d9] focus:ring-[#0052ff]"
                      />
                      <span className="font-['Inter'] text-sm text-[#1a1c1e]">Pickup</span>
                    </label>
                    <label className="flex-1 flex items-center gap-2 cursor-pointer bg-[#f9f9fc] border border-[#c3c5d9]/30 px-4 rounded-lg shadow-xs hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        checked={profile.delivery}
                        onChange={(e) => setProfile({ ...profile, delivery: e.target.checked })}
                        className="w-4 h-4 text-[#0052ff] rounded border-[#c3c5d9] focus:ring-[#0052ff]"
                      />
                      <span className="font-['Inter'] text-sm text-[#1a1c1e]">Delivery</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-[#c3c5d9]/30"></div>

              {/* Hours of Operation */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-['Geist'] text-sm font-medium text-[#1a1c1e]">Operating Hours</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const monVal = profile.hours.monFri;
                      setProfile({
                        ...profile,
                        hours: {
                          monFri: { ...monVal },
                          saturday: { ...monVal },
                          sunday: { ...monVal }
                        }
                      });
                    }}
                    className="text-[#003ec7] font-['Geist'] text-xs font-semibold hover:bg-[#003ec7]/10 px-2 py-1 rounded transition-colors cursor-pointer"
                  >
                    Apply to All Days
                  </button>
                </div>
                <div className="space-y-3">
                  {/* Mon - Fri */}
                  <div className="flex items-center gap-4 p-3 bg-[#f9f9fc] rounded-lg shadow-xs border border-[#c3c5d9]/20">
                    <div className="w-24 font-['Geist'] text-sm font-medium text-[#1a1c1e]">Mon - Fri</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.hours.monFri.active}
                        onChange={(e) => setProfile({
                          ...profile,
                          hours: {
                            ...profile.hours,
                            monFri: { ...profile.hours.monFri, active: e.target.checked }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#e2e2e5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#e2e2e5] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0052ff]"></div>
                    </label>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="time"
                        value={profile.hours.monFri.open}
                        disabled={!profile.hours.monFri.active}
                        onChange={(e) => setProfile({
                          ...profile,
                          hours: {
                            ...profile.hours,
                            monFri: { ...profile.hours.monFri, open: e.target.value }
                          }
                        })}
                        className="bg-white rounded-md border border-[#c3c5d9]/30 px-3 py-1.5 text-xs font-['Inter'] w-full max-w-[120px] focus:ring-1 focus:ring-[#0052ff] disabled:opacity-50"
                      />
                      <span className="text-[#434656] text-xs font-['Inter']">to</span>
                      <input
                        type="time"
                        value={profile.hours.monFri.close}
                        disabled={!profile.hours.monFri.active}
                        onChange={(e) => setProfile({
                          ...profile,
                          hours: {
                            ...profile.hours,
                            monFri: { ...profile.hours.monFri, close: e.target.value }
                          }
                        })}
                        className="bg-white rounded-md border border-[#c3c5d9]/30 px-3 py-1.5 text-xs font-['Inter'] w-full max-w-[120px] focus:ring-1 focus:ring-[#0052ff] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Saturday */}
                  <div className="flex items-center gap-4 p-3 bg-[#f9f9fc] rounded-lg shadow-xs border border-[#c3c5d9]/20">
                    <div className="w-24 font-['Geist'] text-sm font-medium text-[#1a1c1e]">Saturday</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.hours.saturday.active}
                        onChange={(e) => setProfile({
                          ...profile,
                          hours: {
                            ...profile.hours,
                            saturday: { ...profile.hours.saturday, active: e.target.checked }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#e2e2e5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#e2e2e5] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0052ff]"></div>
                    </label>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="time"
                        value={profile.hours.saturday.open}
                        disabled={!profile.hours.saturday.active}
                        onChange={(e) => setProfile({
                          ...profile,
                          hours: {
                            ...profile.hours,
                            saturday: { ...profile.hours.saturday, open: e.target.value }
                          }
                        })}
                        className="bg-white rounded-md border border-[#c3c5d9]/30 px-3 py-1.5 text-xs font-['Inter'] w-full max-w-[120px] focus:ring-1 focus:ring-[#0052ff] disabled:opacity-50"
                      />
                      <span className="text-[#434656] text-xs font-['Inter']">to</span>
                      <input
                        type="time"
                        value={profile.hours.saturday.close}
                        disabled={!profile.hours.saturday.active}
                        onChange={(e) => setProfile({
                          ...profile,
                          hours: {
                            ...profile.hours,
                            saturday: { ...profile.hours.saturday, close: e.target.value }
                          }
                        })}
                        className="bg-white rounded-md border border-[#c3c5d9]/30 px-3 py-1.5 text-xs font-['Inter'] w-full max-w-[120px] focus:ring-1 focus:ring-[#0052ff] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Sunday */}
                  <div className={`flex items-center gap-4 p-3 bg-[#f9f9fc] rounded-lg shadow-xs border border-[#c3c5d9]/20 ${!profile.hours.sunday.active ? 'opacity-70' : ''}`}>
                    <div className="w-24 font-['Geist'] text-sm font-medium text-[#1a1c1e]">Sunday</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.hours.sunday.active}
                        onChange={(e) => setProfile({
                          ...profile,
                          hours: {
                            ...profile.hours,
                            sunday: { ...profile.hours.sunday, active: e.target.checked }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#e2e2e5] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#e2e2e5] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0052ff]"></div>
                    </label>
                    <div className="flex-1 flex items-center gap-2">
                      {profile.hours.sunday.active ? (
                        <>
                          <input
                            type="time"
                            value={profile.hours.sunday.open}
                            onChange={(e) => setProfile({
                              ...profile,
                              hours: {
                                ...profile.hours,
                                sunday: { ...profile.hours.sunday, open: e.target.value }
                              }
                            })}
                            className="bg-white rounded-md border border-[#c3c5d9]/30 px-3 py-1.5 text-xs font-['Inter'] w-full max-w-[120px] focus:ring-1 focus:ring-[#0052ff]"
                          />
                          <span className="text-[#434656] text-xs font-['Inter']">to</span>
                          <input
                            type="time"
                            value={profile.hours.sunday.close}
                            onChange={(e) => setProfile({
                              ...profile,
                              hours: {
                                ...profile.hours,
                                sunday: { ...profile.hours.sunday, close: e.target.value }
                              }
                            })}
                            className="bg-white rounded-md border border-[#c3c5d9]/30 px-3 py-1.5 text-xs font-['Inter'] w-full max-w-[120px] focus:ring-1 focus:ring-[#0052ff]"
                          />
                        </>
                      ) : (
                        <span className="text-xs font-['Inter'] text-[#434656] italic px-3 py-1.5">Closed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-[#c3c5d9]/10">
            <div className="p-6 bg-[#f3f3f6] flex items-center gap-3 border-b border-[#c3c5d9]/20">
              <div className="w-10 h-10 rounded-full bg-[#dee2ed] text-[#494e57] flex items-center justify-center">
                <span className="material-symbols-outlined">contacts</span>
              </div>
              <div>
                <h2 className="font-['Geist'] text-lg font-semibold text-[#1a1c1e]">Contact Details</h2>
                <p className="font-['Inter'] text-xs text-[#434656]">How customers and platform support reach you.</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]" htmlFor="email">Support Email</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-[#434656] material-symbols-outlined text-[20px]">mail</span>
                  <input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full bg-[#f9f9fc] rounded-lg border border-[#c3c5d9]/30 pl-11 pr-4 py-3 font-['Inter'] text-sm text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#0052ff] focus:bg-white transition-colors shadow-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]" htmlFor="phone">Primary Phone (M-Pesa registered)</label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg bg-[#e8e8ea] border border-r-0 border-[#c3c5d9]/30 text-[#434656] font-['Inter'] text-sm shadow-xs font-medium">+254</span>
                  <input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="7XX XXX XXX"
                    className="flex-1 bg-[#f9f9fc] rounded-r-lg border border-[#c3c5d9]/30 px-4 py-3 font-['Inter'] text-sm text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#0052ff] focus:bg-white transition-colors shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payout Destination Card */}
          <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-[#c3c5d9]/10">
            <div className="p-6 bg-[#f3f3f6] flex items-center gap-3 border-b border-[#c3c5d9]/20">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div>
                <h2 className="font-['Geist'] text-lg font-semibold text-[#1a1c1e]">Payout Destination</h2>
                <p className="font-['Inter'] text-xs text-[#434656]">Where your net earnings (after commission) will be transferred.</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]">Payout Method</label>
                <input
                  type="text"
                  disabled
                  value="M-Pesa (Mobile Money)"
                  className="bg-[#e8e8ea] rounded-lg border border-[#c3c5d9]/30 px-4 py-3 font-['Inter'] text-sm text-[#1a1c1e] shadow-xs cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-['Geist'] text-sm font-medium text-[#1a1c1e]">Payout M-Pesa Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 0712345678"
                  value={profile.payoutPhone || ''}
                  onChange={(e) => setProfile({ ...profile, payoutPhone: e.target.value })}
                  className="bg-[#f9f9fc] rounded-lg border border-[#c3c5d9]/30 px-4 py-3 font-['Inter'] text-sm text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#0052ff] focus:bg-white transition-colors shadow-xs"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Action Bar for Saving */}
      <div className="fixed bottom-0 left-0 md:left-72 right-0 p-4 bg-[#f9f9fc]/90 backdrop-blur-md border-t border-[#c3c5d9]/20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex justify-end gap-4 z-40">
        <button
          type="button"
          onClick={() => alert('Profile changes discarded.')}
          className="px-6 py-2.5 rounded-full bg-[#e2e2e5] text-[#434656] font-['Geist'] text-sm font-medium hover:bg-[#dadadc] transition-colors shadow-xs cursor-pointer"
        >
          Discard Changes
        </button>
        <button
          type="button"
          onClick={() => alert('Business Profile saved successfully!')}
          className="px-6 py-2.5 rounded-full bg-[#003ec7] text-white font-['Geist'] text-sm font-medium hover:bg-[#0038b6] transition-colors shadow-md flex items-center gap-2 group cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">save</span>
          Save Profile
        </button>
      </div>
    </div>
  );

  if (!isStandalone) return mainContent;

  return (
    <div className="bg-[#f9f9fc] font-['Inter'] text-[#1a1c1e] min-h-screen flex flex-col">
      <div className="md:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 bg-[#f9f9fc] p-6 md:p-10">
          {mainContent}
        </main>
      </div>
    </div>
  );
}


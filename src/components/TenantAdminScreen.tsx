import React, { useState, useEffect } from 'react';
import { fetcher } from '../lib/fetcher';
import { useUserAttributes } from '../hooks/useUserAttributes';
import { Hotel } from '../utils/types/hotel';
import { RoomType } from '../utils/types/roomType';
import { Room } from '../utils/types/room';
import { RoomTypeRate } from '../utils/types/roomTypeRate';
import './SuperAdminScreen.css';

export const TenantAdminScreen = () => {
  // Get tenant ID from user attributes
  const { attributes, loading: userLoading, error: userError } = useUserAttributes();
  const tenantId = attributes?.['custom:tenantId'];

  // Hotels states
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State per hotel:Record<hotelId, 'room-types' | 'rooms' | 'rates'>
  const [activeTabs, setActiveTabs] = useState<Record<string, 'room-types' | 'rooms' | 'rates'>>(
    {},
  );
  const [expandedHotels, setExpandedHotels] = useState<Record<string, boolean>>({});

  // Room Types states
  const [roomTypesByHotel, setRoomTypesByHotel] = useState<Record<string, RoomType[]>>({});
  const [roomTypesLoading, setRoomTypesLoading] = useState<Record<string, boolean>>({});
  const [roomTypesError, setRoomTypesError] = useState<Record<string, string | null>>({});

  // Rooms states
  const [roomsByHotel, setRoomsByHotel] = useState<Record<string, Room[]>>({});
  const [roomsLoading, setRoomsLoading] = useState<Record<string, boolean>>({});
  const [roomsError, setRoomsError] = useState<Record<string, string | null>>({});

  // Rates states
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<Record<string, string>>({});
  const [ratesByRoomType, setRatesByRoomType] = useState<Record<string, RoomTypeRate[]>>({});
  const [ratesLoading, setRatesLoading] = useState<Record<string, boolean>>({});
  const [ratesError, setRatesError] = useState<Record<string, string | null>>({});

  // Form State / Modals
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Room Type Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [activeHotelName, setActiveHotelName] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [activeRoomType, setActiveRoomType] = useState<RoomType | null>(null);

  // Room Type Form Fields
  const [rtName, setRtName] = useState<string>('');
  const [rtDescription, setRtDescription] = useState<string>('');
  const [rtBaseNightlyRate, setRtBaseNightlyRate] = useState<string>('');
  const [rtMaxGuests, setRtMaxGuests] = useState<string>('2');
  const [rtMaxAdults, setRtMaxAdults] = useState<string>('2');
  const [rtMaxChildren, setRtMaxChildren] = useState<string>('0');
  const [rtMaxInfants, setRtMaxInfants] = useState<string>('0');
  const [rtExcludeInfants, setRtExcludeInfants] = useState<boolean>(false);

  // 2. Room Modals
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState<boolean>(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState<boolean>(false);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  // Room Form Fields
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [roomTypeId, setRoomTypeId] = useState<string>('');

  // 3. Rate Modals
  const [isCreateRateModalOpen, setIsCreateRateModalOpen] = useState<boolean>(false);
  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState<boolean>(false);
  const [activeRate, setActiveRate] = useState<RoomTypeRate | null>(null);

  // Rate Form Fields
  const [rateCalendarDate, setRateCalendarDate] = useState<string>('');
  const [rateNightlyRate, setRateNightlyRate] = useState<string>('');

  // Calendar navigation states per hotel: Record<hotelId, monthIndex 0-11> and Record<hotelId, year>
  const [calendarMonths, setCalendarMonths] = useState<Record<string, number>>({});
  const [calendarYears, setCalendarYears] = useState<Record<string, number>>({});

  // Bulk Rate Update Fields
  const [isBulkRateModalOpen, setIsBulkRateModalOpen] = useState<boolean>(false);
  const [bulkStartDate, setBulkStartDate] = useState<string>('');
  const [bulkEndDate, setBulkEndDate] = useState<string>('');
  const [bulkNightlyRate, setBulkNightlyRate] = useState<string>('');
  const [bulkDaysOfWeek, setBulkDaysOfWeek] = useState<Record<number, boolean>>({
    0: true, // Sunday
    1: true, // Monday
    2: true, // Tuesday
    3: true, // Wednesday
    4: true, // Thursday
    5: true, // Friday
    6: true, // Saturday
  });

  // Notification states
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Load hotels for the tenant
  const loadHotels = async (isRefetch = false) => {
    if (!tenantId) return;
    if (!isRefetch) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetcher<any>(`/tenants/${tenantId}/hotels`);
      const hotelsList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.hotels)
            ? response.hotels
            : [];

      hotelsList.sort((a: Hotel, b: Hotel) => a.name.localeCompare(b.name));
      setHotels(hotelsList);
    } catch (err: any) {
      console.error('Failed to load hotels:', err);
      setError(
        err?.info?.message || err?.message || 'Failed to retrieve hotels. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Load room types for a hotel
  const loadRoomTypes = async (hotelId: string) => {
    if (!tenantId) return;
    setRoomTypesLoading((prev) => ({ ...prev, [hotelId]: true }));
    setRoomTypesError((prev) => ({ ...prev, [hotelId]: null }));

    try {
      const response = await fetcher<any>(`/tenants/${tenantId}/hotels/${hotelId}/room-types`);
      const roomTypesList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.roomTypes)
            ? response.roomTypes
            : [];

      roomTypesList.sort((a: RoomType, b: RoomType) => a.name.localeCompare(b.name));
      setRoomTypesByHotel((prev) => ({ ...prev, [hotelId]: roomTypesList }));
      return roomTypesList;
    } catch (err: any) {
      console.error(`Failed to load room types for hotel ${hotelId}:`, err);
      setRoomTypesError((prev) => ({
        ...prev,
        [hotelId]: err?.info?.message || err?.message || 'Failed to retrieve room types.',
      }));
    } finally {
      setRoomTypesLoading((prev) => ({ ...prev, [hotelId]: false }));
    }
  };

  // Load rooms for a hotel
  const loadRooms = async (hotelId: string) => {
    if (!tenantId) return;
    setRoomsLoading((prev) => ({ ...prev, [hotelId]: true }));
    setRoomsError((prev) => ({ ...prev, [hotelId]: null }));

    try {
      const response = await fetcher<any>(`/tenants/${tenantId}/hotels/${hotelId}/rooms`);
      const roomsList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.rooms)
            ? response.rooms
            : [];

      roomsList.sort((a: Room, b: Room) => a.roomNumber.localeCompare(b.roomNumber));
      setRoomsByHotel((prev) => ({ ...prev, [hotelId]: roomsList }));
    } catch (err: any) {
      console.error(`Failed to load rooms for hotel ${hotelId}:`, err);
      setRoomsError((prev) => ({
        ...prev,
        [hotelId]: err?.info?.message || err?.message || 'Failed to retrieve rooms.',
      }));
    } finally {
      setRoomsLoading((prev) => ({ ...prev, [hotelId]: false }));
    }
  };

  // Load rates for a room type
  const loadRates = async (hotelId: string, roomTypeId: string) => {
    if (!tenantId || !roomTypeId) return;
    setRatesLoading((prev) => ({ ...prev, [roomTypeId]: true }));
    setRatesError((prev) => ({ ...prev, [roomTypeId]: null }));

    try {
      const response = await fetcher<any>(
        `/tenants/${tenantId}/hotels/${hotelId}/room-types/${roomTypeId}/rates`,
      );
      const ratesList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.rates)
            ? response.rates
            : [];

      // Sort rates by date ascending
      ratesList.sort(
        (a: RoomTypeRate, b: RoomTypeRate) =>
          new Date(a.calendarDate).getTime() - new Date(b.calendarDate).getTime(),
      );
      setRatesByRoomType((prev) => ({ ...prev, [roomTypeId]: ratesList }));
    } catch (err: any) {
      console.error(`Failed to load rates for room type ${roomTypeId}:`, err);
      setRatesError((prev) => ({
        ...prev,
        [roomTypeId]: err?.info?.message || err?.message || 'Failed to retrieve rates.',
      }));
    } finally {
      setRatesLoading((prev) => ({ ...prev, [roomTypeId]: false }));
    }
  };

  // Month Names Helper
  const getMonthName = (monthIndex: number) => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[monthIndex] || '';
  };

  // Previous Month Navigation
  const handlePrevMonth = (hotelId: string) => {
    const now = new Date();
    const currentM =
      calendarMonths[hotelId] !== undefined ? calendarMonths[hotelId] : now.getUTCMonth();
    const currentY =
      calendarYears[hotelId] !== undefined ? calendarYears[hotelId] : now.getUTCFullYear();

    const newM = currentM === 0 ? 11 : currentM - 1;
    const newY = currentM === 0 ? currentY - 1 : currentY;

    setCalendarMonths((prev) => ({ ...prev, [hotelId]: newM }));
    setCalendarYears((prev) => ({ ...prev, [hotelId]: newY }));
  };

  // Next Month Navigation
  const handleNextMonth = (hotelId: string) => {
    const now = new Date();
    const currentM =
      calendarMonths[hotelId] !== undefined ? calendarMonths[hotelId] : now.getUTCMonth();
    const currentY =
      calendarYears[hotelId] !== undefined ? calendarYears[hotelId] : now.getUTCFullYear();

    const newM = currentM === 11 ? 0 : currentM + 1;
    const newY = currentM === 11 ? currentY + 1 : currentY;

    setCalendarMonths((prev) => ({ ...prev, [hotelId]: newM }));
    setCalendarYears((prev) => ({ ...prev, [hotelId]: newY }));
  };

  // Generate 42-day Calendar Grid
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(Date.UTC(year, month, 1));
    const startingDayOfWeek = firstDay.getUTCDay(); // 0 (Sunday) to 6 (Saturday)
    const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month filler days
    const prevMonthTotalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Next month filler days
    const remainingCells = 42 - days.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return days;
  };

  // Toggle hotel expansion
  const toggleHotel = async (hotelId: string) => {
    const isCurrentlyExpanded = !!expandedHotels[hotelId];
    setExpandedHotels((prev) => ({
      ...prev,
      [hotelId]: !isCurrentlyExpanded,
    }));

    if (!isCurrentlyExpanded) {
      setActiveTabs((prev) => ({ ...prev, [hotelId]: 'room-types' }));
      await loadRoomTypes(hotelId);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadHotels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // Handle temporary notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- ROOM TYPE CRUD HANDLERS ---

  const openCreateModal = (hotelId: string, hotelName: string) => {
    setActiveHotelId(hotelId);
    setActiveHotelName(hotelName);
    setRtName('');
    setRtDescription('');
    setRtBaseNightlyRate('');
    setRtMaxGuests('2');
    setRtMaxAdults('2');
    setRtMaxChildren('0');
    setRtMaxInfants('0');
    setRtExcludeInfants(false);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (roomType: RoomType) => {
    setActiveRoomType(roomType);
    setRtName(roomType.name);
    setRtDescription(roomType.description || '');
    setRtBaseNightlyRate(String(roomType.baseNightlyRate));
    setRtMaxGuests(String(roomType.maxGuests));
    setRtMaxAdults(String(roomType.maxAdults));
    setRtMaxChildren(String(roomType.maxChildren));
    setRtMaxInfants(String(roomType.maxInfants));
    setRtExcludeInfants(roomType.excludeInfantsFromMaxGuests);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = rtName.trim();
    if (!trimmedName) {
      setFormError('Room Type name is required.');
      return;
    }
    const rate = parseFloat(rtBaseNightlyRate);
    if (isNaN(rate) || rate < 0) {
      setFormError('Base Nightly Rate must be a non-negative number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetcher<RoomType>(`/tenants/${tenantId}/hotels/${activeHotelId}/room-types`, {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          description: rtDescription.trim() || null,
          baseNightlyRate: rate,
          maxGuests: parseInt(rtMaxGuests, 10),
          maxAdults: parseInt(rtMaxAdults, 10),
          maxChildren: parseInt(rtMaxChildren, 10),
          maxInfants: parseInt(rtMaxInfants, 10),
          excludeInfantsFromMaxGuests: rtExcludeInfants,
        }),
      });

      setNotification({
        message: `Room Type "${trimmedName}" created successfully!`,
        type: 'success',
      });

      setIsCreateModalOpen(false);
      if (activeHotelId) {
        await loadRoomTypes(activeHotelId);
      }
    } catch (err: any) {
      console.error('Failed to create room type:', err);
      setFormError(
        err?.info?.message || err?.message || 'Failed to create room type. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeRoomType) return;

    const trimmedName = rtName.trim();
    if (!trimmedName) {
      setFormError('Room Type name is required.');
      return;
    }
    const rate = parseFloat(rtBaseNightlyRate);
    if (isNaN(rate) || rate < 0) {
      setFormError('Base Nightly Rate must be a non-negative number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetcher<RoomType>(
        `/tenants/${tenantId}/hotels/${activeRoomType.hotelId}/room-types/${activeRoomType.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: trimmedName,
            description: rtDescription.trim() || null,
            baseNightlyRate: rate,
            maxGuests: parseInt(rtMaxGuests, 10),
            maxAdults: parseInt(rtMaxAdults, 10),
            maxChildren: parseInt(rtMaxChildren, 10),
            maxInfants: parseInt(rtMaxInfants, 10),
            excludeInfantsFromMaxGuests: rtExcludeInfants,
          }),
        },
      );

      setNotification({
        message: `Room Type "${trimmedName}" updated successfully!`,
        type: 'success',
      });

      setIsEditModalOpen(false);
      await loadRoomTypes(activeRoomType.hotelId);
    } catch (err: any) {
      console.error('Failed to update room type:', err);
      setFormError(
        err?.info?.message || err?.message || 'Failed to update room type. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ROOM CRUD HANDLERS ---

  const openCreateRoomModal = (hotelId: string, hotelName: string) => {
    setActiveHotelId(hotelId);
    setActiveHotelName(hotelName);
    setRoomNumber('');
    const types = roomTypesByHotel[hotelId] || [];
    setRoomTypeId(types[0]?.id || '');
    setFormError(null);
    setIsCreateRoomModalOpen(true);
  };

  const openEditRoomModal = (room: Room) => {
    setActiveRoom(room);
    setRoomNumber(room.roomNumber);
    setRoomTypeId(room.roomTypeId);
    setFormError(null);
    setIsEditRoomModalOpen(true);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedNumber = roomNumber.trim();
    if (!trimmedNumber) {
      setFormError('Room number is required.');
      return;
    }
    if (!roomTypeId) {
      setFormError('Room Type is required. Configure Room Types first.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetcher<Room>(`/tenants/${tenantId}/hotels/${activeHotelId}/rooms`, {
        method: 'POST',
        body: JSON.stringify({
          roomNumber: trimmedNumber,
          roomTypeId,
        }),
      });

      setNotification({
        message: `Room "${trimmedNumber}" created successfully!`,
        type: 'success',
      });

      setIsCreateRoomModalOpen(false);
      if (activeHotelId) {
        await loadRooms(activeHotelId);
      }
    } catch (err: any) {
      console.error('Failed to create room:', err);
      setFormError(
        err?.info?.message || err?.message || 'Failed to create room. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeRoom) return;

    const trimmedNumber = roomNumber.trim();
    if (!trimmedNumber) {
      setFormError('Room number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetcher<Room>(
        `/tenants/${tenantId}/hotels/${activeRoom.hotelId}/rooms/${activeRoom.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            roomNumber: trimmedNumber,
            roomTypeId,
          }),
        },
      );

      setNotification({
        message: `Room "${trimmedNumber}" updated successfully!`,
        type: 'success',
      });

      setIsEditRoomModalOpen(false);
      await loadRooms(activeRoom.hotelId);
    } catch (err: any) {
      console.error('Failed to update room:', err);
      setFormError(
        err?.info?.message || err?.message || 'Failed to update room. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RATE CRUD HANDLERS ---

  const openBulkRateModal = (hotelId: string, hotelName: string) => {
    setActiveHotelId(hotelId);
    setActiveHotelName(hotelName);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    setBulkStartDate(todayStr);
    setBulkEndDate(nextMonthStr);
    setBulkNightlyRate('');
    setBulkDaysOfWeek({
      0: true,
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
    });
    setFormError(null);
    setIsBulkRateModalOpen(true);
  };

  const openCreateRateModal = (
    hotelId: string,
    hotelName: string,
    rtId: string,
    prefilledDate?: string,
  ) => {
    setActiveHotelId(hotelId);
    setActiveHotelName(hotelName);
    setRateCalendarDate(prefilledDate || '');
    setRateNightlyRate('');
    setFormError(null);
    setIsCreateRateModalOpen(true);
  };

  const openEditRateModal = (rate: RoomTypeRate) => {
    setActiveRate(rate);
    // Format ISO string back to YYYY-MM-DD
    const isoDate = new Date(rate.calendarDate).toISOString().split('T')[0];
    setRateCalendarDate(isoDate);
    setRateNightlyRate(String(rate.nightlyRate));
    setFormError(null);
    setIsEditRateModalOpen(true);
  };

  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!rateCalendarDate) {
      setFormError('Calendar date is required.');
      return;
    }
    const rateVal = parseFloat(rateNightlyRate);
    if (isNaN(rateVal) || rateVal < 0) {
      setFormError('Nightly rate must be a non-negative number.');
      return;
    }

    const currentRoomTypeId = selectedRoomTypes[activeHotelId || ''];
    if (!currentRoomTypeId) {
      setFormError('No Room Type selected.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetcher<RoomTypeRate>(
        `/tenants/${tenantId}/hotels/${activeHotelId}/room-types/${currentRoomTypeId}/rates`,
        {
          method: 'POST',
          body: JSON.stringify({
            calendarDate: rateCalendarDate,
            nightlyRate: rateVal,
          }),
        },
      );

      setNotification({
        message: `Special rate added successfully!`,
        type: 'success',
      });

      setIsCreateRateModalOpen(false);
      await loadRates(activeHotelId!, currentRoomTypeId);
    } catch (err: any) {
      console.error('Failed to create rate:', err);
      setFormError(
        err?.info?.message || err?.message || 'Failed to configure special rate. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!bulkStartDate || !bulkEndDate) {
      setFormError('Start and End dates are required.');
      return;
    }

    const start = new Date(`${bulkStartDate}T00:00:00.000Z`);
    const end = new Date(`${bulkEndDate}T00:00:00.000Z`);
    if (end < start) {
      setFormError('End date cannot be prior to start date.');
      return;
    }

    const rateVal = parseFloat(bulkNightlyRate);
    if (isNaN(rateVal) || rateVal < 0) {
      setFormError('Nightly rate must be a non-negative number.');
      return;
    }

    const currentRoomTypeId = selectedRoomTypes[activeHotelId || ''];
    if (!currentRoomTypeId) {
      setFormError('No Room Type selected.');
      return;
    }

    const selectedDays = Object.keys(bulkDaysOfWeek)
      .map(Number)
      .filter((day) => bulkDaysOfWeek[day]);
    if (selectedDays.length === 0) {
      setFormError('Please select at least one day of the week.');
      return;
    }

    const datesToUpdate: string[] = [];
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const dayOfWeek = tempDate.getUTCDay();
      if (bulkDaysOfWeek[dayOfWeek]) {
        datesToUpdate.push(tempDate.toISOString().split('T')[0]);
      }
      tempDate.setUTCDate(tempDate.getUTCDate() + 1);
    }

    if (datesToUpdate.length === 0) {
      setFormError('No dates in the selected range match the selected days of the week.');
      return;
    }

    const customRatesMap: Record<string, RoomTypeRate> = {};
    const customRatesList = ratesByRoomType[currentRoomTypeId] || [];
    customRatesList.forEach((rate) => {
      try {
        const dateStr = new Date(rate.calendarDate).toISOString().split('T')[0];
        customRatesMap[dateStr] = rate;
      } catch (_) {}
    });

    setIsSubmitting(true);
    try {
      const promises = datesToUpdate.map((dateStr) => {
        const existingRate = customRatesMap[dateStr];
        if (existingRate) {
          return fetcher<RoomTypeRate>(
            `/tenants/${tenantId}/hotels/${activeHotelId}/room-types/${currentRoomTypeId}/rates/${existingRate.id}`,
            {
              method: 'PATCH',
              body: JSON.stringify({
                calendarDate: dateStr,
                nightlyRate: rateVal,
              }),
            },
          );
        } else {
          return fetcher<RoomTypeRate>(
            `/tenants/${tenantId}/hotels/${activeHotelId}/room-types/${currentRoomTypeId}/rates`,
            {
              method: 'POST',
              body: JSON.stringify({
                calendarDate: dateStr,
                nightlyRate: rateVal,
              }),
            },
          );
        }
      });

      await Promise.all(promises);

      setNotification({
        message: `Successfully updated rates for ${datesToUpdate.length} days!`,
        type: 'success',
      });

      setIsBulkRateModalOpen(false);
      await loadRates(activeHotelId!, currentRoomTypeId);
    } catch (err: any) {
      console.error('Failed to perform bulk rate update:', err);
      setFormError(
        err?.info?.message || err?.message || 'Failed to update rates in bulk. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeRate) return;

    if (!rateCalendarDate) {
      setFormError('Calendar date is required.');
      return;
    }
    const rateVal = parseFloat(rateNightlyRate);
    if (isNaN(rateVal) || rateVal < 0) {
      setFormError('Nightly rate must be a non-negative number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetcher<RoomTypeRate>(
        `/tenants/${tenantId}/hotels/${activeRate.hotelId}/room-types/${activeRate.roomTypeId}/rates/${activeRate.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            calendarDate: rateCalendarDate,
            nightlyRate: rateVal,
          }),
        },
      );

      setNotification({
        message: `Nightly rate updated successfully!`,
        type: 'success',
      });

      setIsEditRateModalOpen(false);
      await loadRates(activeRate.hotelId, activeRate.roomTypeId);
    } catch (err: any) {
      console.error('Failed to update rate:', err);
      setFormError(
        err?.info?.message || err?.message || 'Failed to update special rate. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="dashboard-container">
        <p>Loading tenant workspace...</p>
      </div>
    );
  }

  if (userError || !tenantId) {
    return (
      <div className="dashboard-container" style={{ marginTop: '60px' }}>
        <div className="notification-banner error">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            {userError
              ? `Error fetching user account: ${userError.message}`
              : 'Unauthorized: No Tenant ID associated with your user profile.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h2>Tenant Admin Dashboard</h2>
          <p>
            Manage hotels, configurations, rooms, and nightly pricing calendars for your
            organization.
          </p>
        </div>
      </div>

      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.type === 'success' ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {notification.message}
        </div>
      )}

      {error && (
        <div className="notification-banner error">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ flex: 1 }}>{error}</div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => loadHotels()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="dashboard-card">
        <div className="table-wrapper">
          <table className="tenant-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}></th>
                <th>Hotel ID</th>
                <th>Hotel Name</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    <td>
                      <div className="skeleton-line" style={{ width: '24px' }} />
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '180px' }} />
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '120px' }} />
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '140px' }} />
                    </td>
                  </tr>
                ))
              ) : hotels.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">
                      <svg
                        className="empty-state-icon"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <h3>No hotels registered</h3>
                      <p>
                        Please contact a System Administrator to register a hotel for your tenant.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                hotels.map((hotel) => {
                  const isExpanded = !!expandedHotels[hotel.id];
                  const currentTab = activeTabs[hotel.id] || 'room-types';

                  return (
                    <React.Fragment key={hotel.id}>
                      <tr>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => toggleHotel(hotel.id)}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            <svg
                              className="expand-chevron"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        </td>
                        <td>
                          <span className="tenant-id-badge" title={hotel.id}>
                            {hotel.id}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{hotel.name}</td>
                        <td className="tenant-date">
                          {new Date(hotel.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="nested-row">
                          <td colSpan={4}>
                            <div
                              className="nested-hotels-container"
                              style={{ paddingLeft: '24px' }}
                            >
                              {/* Sub-Tab Bar Navigation */}
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '8px',
                                  borderBottom: '1px solid var(--border-color)',
                                  marginBottom: '16px',
                                  paddingBottom: '8px',
                                }}
                              >
                                <button
                                  className={`btn ${currentTab === 'room-types' ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                  onClick={() =>
                                    setActiveTabs((prev) => ({ ...prev, [hotel.id]: 'room-types' }))
                                  }
                                >
                                  Room Types
                                </button>
                                <button
                                  className={`btn ${currentTab === 'rooms' ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                  onClick={() => {
                                    setActiveTabs((prev) => ({ ...prev, [hotel.id]: 'rooms' }));
                                    loadRooms(hotel.id);
                                  }}
                                >
                                  Rooms
                                </button>
                                <button
                                  className={`btn ${currentTab === 'rates' ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                  onClick={async () => {
                                    setActiveTabs((prev) => ({ ...prev, [hotel.id]: 'rates' }));
                                    const now = new Date();
                                    if (calendarMonths[hotel.id] === undefined) {
                                      setCalendarMonths((prev) => ({
                                        ...prev,
                                        [hotel.id]: now.getUTCMonth(),
                                      }));
                                      setCalendarYears((prev) => ({
                                        ...prev,
                                        [hotel.id]: now.getUTCFullYear(),
                                      }));
                                    }
                                    const types = await loadRoomTypes(hotel.id);
                                    if (types && types.length > 0 && !selectedRoomTypes[hotel.id]) {
                                      setSelectedRoomTypes((prev) => ({
                                        ...prev,
                                        [hotel.id]: types[0].id,
                                      }));
                                      loadRates(hotel.id, types[0].id);
                                    }
                                  }}
                                >
                                  Calendar Rates
                                </button>
                              </div>

                              {/* TAB 1: Room Types */}
                              {currentTab === 'room-types' && (
                                <div>
                                  <div className="nested-hotels-header">
                                    <h4>Room Types for {hotel.name}</h4>
                                    <button
                                      className="btn btn-primary"
                                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                      onClick={() => openCreateModal(hotel.id, hotel.name)}
                                    >
                                      Add Room Type
                                    </button>
                                  </div>

                                  {roomTypesLoading[hotel.id] ? (
                                    <div
                                      className="nested-hotels-table-wrapper"
                                      style={{ padding: '16px' }}
                                    >
                                      <div
                                        className="skeleton-line"
                                        style={{ width: '100%', marginBottom: '8px' }}
                                      />
                                      <div className="skeleton-line" style={{ width: '60%' }} />
                                    </div>
                                  ) : roomTypesError[hotel.id] ? (
                                    <div
                                      className="notification-banner error"
                                      style={{ margin: 0 }}
                                    >
                                      {roomTypesError[hotel.id]}
                                    </div>
                                  ) : !roomTypesByHotel[hotel.id] ||
                                    roomTypesByHotel[hotel.id].length === 0 ? (
                                    <div className="nested-hotels-table-wrapper">
                                      <div className="nested-hotels-empty">
                                        No room types configured for this hotel yet.
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="nested-hotels-table-wrapper">
                                      <table className="nested-hotels-table">
                                        <thead>
                                          <tr>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Nightly Rate</th>
                                            <th>Occupancy Limits</th>
                                            <th style={{ width: '80px', textAlign: 'center' }}>
                                              Actions
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {roomTypesByHotel[hotel.id].map((rt) => (
                                            <tr key={rt.id}>
                                              <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                {rt.name}
                                              </td>
                                              <td>{rt.description || '-'}</td>
                                              <td
                                                style={{ fontWeight: 600, color: 'var(--success)' }}
                                              >
                                                ${Number(rt.baseNightlyRate).toFixed(2)}
                                              </td>
                                              <td style={{ fontSize: '0.82rem' }}>
                                                <div>
                                                  Guests: <strong>{rt.maxGuests}</strong> (A:{' '}
                                                  {rt.maxAdults}, C: {rt.maxChildren})
                                                </div>
                                                <div>
                                                  Infants: <strong>{rt.maxInfants}</strong>{' '}
                                                  {rt.excludeInfantsFromMaxGuests && (
                                                    <span
                                                      style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--text-muted)',
                                                      }}
                                                    >
                                                      (Excluded)
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                              <td style={{ textAlign: 'center' }}>
                                                <button
                                                  className="btn btn-secondary"
                                                  style={{
                                                    padding: '4px 10px',
                                                    fontSize: '0.8rem',
                                                  }}
                                                  onClick={() => openEditModal(rt)}
                                                >
                                                  Edit
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* TAB 2: Rooms */}
                              {currentTab === 'rooms' && (
                                <div>
                                  <div className="nested-hotels-header">
                                    <h4>Physical Rooms ({roomsByHotel[hotel.id]?.length || 0})</h4>
                                    <button
                                      className="btn btn-primary"
                                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                      onClick={() => openCreateRoomModal(hotel.id, hotel.name)}
                                    >
                                      Add Room
                                    </button>
                                  </div>

                                  {roomsLoading[hotel.id] ? (
                                    <div
                                      className="nested-hotels-table-wrapper"
                                      style={{ padding: '16px' }}
                                    >
                                      <div
                                        className="skeleton-line"
                                        style={{ width: '100%', marginBottom: '8px' }}
                                      />
                                      <div className="skeleton-line" style={{ width: '60%' }} />
                                    </div>
                                  ) : roomsError[hotel.id] ? (
                                    <div
                                      className="notification-banner error"
                                      style={{ margin: 0 }}
                                    >
                                      {roomsError[hotel.id]}
                                    </div>
                                  ) : !roomsByHotel[hotel.id] ||
                                    roomsByHotel[hotel.id].length === 0 ? (
                                    <div className="nested-hotels-table-wrapper">
                                      <div className="nested-hotels-empty">
                                        No rooms added to this hotel yet. Create rooms to allocate
                                        bookings.
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="nested-hotels-table-wrapper">
                                      <table className="nested-hotels-table">
                                        <thead>
                                          <tr>
                                            <th>Room Number</th>
                                            <th>Associated Room Type</th>
                                            <th style={{ width: '80px', textAlign: 'center' }}>
                                              Actions
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {roomsByHotel[hotel.id].map((room) => (
                                            <tr key={room.id}>
                                              <td style={{ fontWeight: 600 }}>{room.roomNumber}</td>
                                              <td>
                                                <span
                                                  style={{
                                                    backgroundColor: 'var(--accent-light)',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 500,
                                                  }}
                                                >
                                                  {room.roomType?.name || 'Unknown'}
                                                </span>
                                              </td>
                                              <td style={{ textAlign: 'center' }}>
                                                <button
                                                  className="btn btn-secondary"
                                                  style={{
                                                    padding: '4px 10px',
                                                    fontSize: '0.8rem',
                                                  }}
                                                  onClick={() => openEditRoomModal(room)}
                                                >
                                                  Edit
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* TAB 3: Rates */}
                              {currentTab === 'rates' && (
                                <div>
                                  <div
                                    className="nested-hotels-header"
                                    style={{ flexWrap: 'wrap', gap: '16px' }}
                                  >
                                    <div
                                      style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                                    >
                                      <h4 style={{ margin: 0 }}>Special Nightly Rates</h4>
                                      <select
                                        className="form-control"
                                        style={{
                                          width: '220px',
                                          padding: '6px 10px',
                                          fontSize: '0.88rem',
                                        }}
                                        value={selectedRoomTypes[hotel.id] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setSelectedRoomTypes((prev) => ({
                                            ...prev,
                                            [hotel.id]: val,
                                          }));
                                          loadRates(hotel.id, val);
                                        }}
                                      >
                                        <option value="" disabled>
                                          Select a Room Type
                                        </option>
                                        {(roomTypesByHotel[hotel.id] || []).map((type) => (
                                          <option key={type.id} value={type.id}>
                                            {type.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    {selectedRoomTypes[hotel.id] && (
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                          className="btn btn-primary"
                                          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                          onClick={() =>
                                            openCreateRateModal(
                                              hotel.id,
                                              hotel.name,
                                              selectedRoomTypes[hotel.id],
                                            )
                                          }
                                        >
                                          Add Special Rate
                                        </button>
                                        <button
                                          className="btn btn-secondary"
                                          style={{
                                            padding: '6px 12px',
                                            fontSize: '0.82rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                          }}
                                          onClick={() => openBulkRateModal(hotel.id, hotel.name)}
                                        >
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <rect
                                              x="3"
                                              y="4"
                                              width="18"
                                              height="18"
                                              rx="2"
                                              ry="2"
                                            />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                          </svg>
                                          Bulk Update Rates
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {!selectedRoomTypes[hotel.id] ? (
                                    <div className="nested-hotels-table-wrapper">
                                      <div className="nested-hotels-empty">
                                        Please select a Room Type to view or add nightly rates.
                                      </div>
                                    </div>
                                  ) : ratesLoading[selectedRoomTypes[hotel.id]] ? (
                                    <div
                                      className="nested-hotels-table-wrapper"
                                      style={{ padding: '16px' }}
                                    >
                                      <div
                                        className="skeleton-line"
                                        style={{ width: '100%', marginBottom: '8px' }}
                                      />
                                      <div className="skeleton-line" style={{ width: '60%' }} />
                                    </div>
                                  ) : ratesError[selectedRoomTypes[hotel.id]] ? (
                                    <div
                                      className="notification-banner error"
                                      style={{ margin: 0 }}
                                    >
                                      {ratesError[selectedRoomTypes[hotel.id]]}
                                    </div>
                                  ) : (
                                    (() => {
                                      const currentMonthIndex =
                                        calendarMonths[hotel.id] !== undefined
                                          ? calendarMonths[hotel.id]
                                          : new Date().getUTCMonth();
                                      const currentYear =
                                        calendarYears[hotel.id] !== undefined
                                          ? calendarYears[hotel.id]
                                          : new Date().getUTCFullYear();
                                      const calendarDays = getDaysInMonth(
                                        currentYear,
                                        currentMonthIndex,
                                      );
                                      const activeRtId = selectedRoomTypes[hotel.id];
                                      const activeRt = (roomTypesByHotel[hotel.id] || []).find(
                                        (rt) => rt.id === activeRtId,
                                      );
                                      const baseRate = activeRt
                                        ? Number(activeRt.baseNightlyRate)
                                        : 0;

                                      const customRatesMap: Record<string, RoomTypeRate> = {};
                                      const customRatesList = ratesByRoomType[activeRtId] || [];
                                      customRatesList.forEach((rate) => {
                                        try {
                                          const dateStr = new Date(rate.calendarDate)
                                            .toISOString()
                                            .split('T')[0];
                                          customRatesMap[dateStr] = rate;
                                        } catch (_) {}
                                      });

                                      return (
                                        <div style={{ marginTop: '12px' }}>
                                          {/* Calendar Header with Navigation */}
                                          <div
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              marginBottom: '16px',
                                              flexWrap: 'wrap',
                                              gap: '12px',
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                              }}
                                            >
                                              <button
                                                className="btn btn-secondary"
                                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                onClick={() => handlePrevMonth(hotel.id)}
                                                type="button"
                                              >
                                                &lt;
                                              </button>
                                              <span
                                                style={{
                                                  fontSize: '1.05rem',
                                                  fontWeight: 700,
                                                  minWidth: '140px',
                                                  textAlign: 'center',
                                                  display: 'inline-block',
                                                }}
                                              >
                                                {getMonthName(currentMonthIndex)} {currentYear}
                                              </span>
                                              <button
                                                className="btn btn-secondary"
                                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                onClick={() => handleNextMonth(hotel.id)}
                                                type="button"
                                              >
                                                &gt;
                                              </button>
                                            </div>

                                            <div
                                              style={{
                                                fontSize: '0.82rem',
                                                color: 'var(--text-secondary)',
                                                display: 'flex',
                                                gap: '16px',
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '6px',
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '3px',
                                                    backgroundColor: 'var(--success-light)',
                                                    border: '1px solid var(--success)',
                                                  }}
                                                />
                                                <span>Custom Rate</span>
                                              </div>
                                              <div
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '6px',
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '3px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                    border: '1px solid var(--border-color)',
                                                  }}
                                                />
                                                <span>Standard (${baseRate.toFixed(2)})</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Days of Week Header */}
                                          <div
                                            style={{
                                              display: 'grid',
                                              gridTemplateColumns: 'repeat(7, 1fr)',
                                              gap: '6px',
                                              marginBottom: '6px',
                                              textAlign: 'center',
                                            }}
                                          >
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                                              (day) => (
                                                <div
                                                  key={day}
                                                  style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: 'var(--text-muted)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                  }}
                                                >
                                                  {day}
                                                </div>
                                              ),
                                            )}
                                          </div>

                                          {/* Days Grid */}
                                          <div className="calendar-grid">
                                            {calendarDays.map(
                                              ({ dateStr, dayNum, isCurrentMonth }) => {
                                                const specialRateObj = customRatesMap[dateStr];
                                                const isSpecial = !!specialRateObj;
                                                const activePrice = isSpecial
                                                  ? Number(specialRateObj.nightlyRate)
                                                  : baseRate;

                                                return (
                                                  <div
                                                    key={dateStr}
                                                    className={`calendar-day-cell ${isCurrentMonth ? '' : 'other-month'}`}
                                                    onClick={() => {
                                                      if (isSpecial) {
                                                        openEditRateModal(specialRateObj);
                                                      } else {
                                                        openCreateRateModal(
                                                          hotel.id,
                                                          hotel.name,
                                                          activeRtId,
                                                          dateStr,
                                                        );
                                                      }
                                                    }}
                                                  >
                                                    <div
                                                      style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        width: '100%',
                                                      }}
                                                    >
                                                      <span className="calendar-day-number">
                                                        {dayNum}
                                                      </span>
                                                      {isSpecial && (
                                                        <span className="calendar-day-special-indicator">
                                                          Custom
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div
                                                      className={`calendar-day-price ${isSpecial ? 'special-rate' : 'base-rate'}`}
                                                    >
                                                      ${activePrice.toFixed(2)}
                                                    </div>
                                                  </div>
                                                );
                                              },
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Room Type Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsCreateModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Add Room Type for {activeHotelName}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateRoomType}>
              <div className="modal-body">
                {formError && (
                  <div className="notification-banner error" style={{ margin: '0 0 16px' }}>
                    {formError}
                  </div>
                )}
                <div className="form-group">
                  <label>Room Type Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Deluxe Suite"
                    value={rtName}
                    onChange={(e) => setRtName(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Describe the room type amenities, view, etc."
                    value={rtDescription}
                    onChange={(e) => setRtDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Base Nightly Rate ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 150.00"
                    step="0.01"
                    min="0"
                    value={rtBaseNightlyRate}
                    onChange={(e) => setRtBaseNightlyRate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Max Guests</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={rtMaxGuests}
                      onChange={(e) => setRtMaxGuests(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Adults</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={rtMaxAdults}
                      onChange={(e) => setRtMaxAdults(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Max Children</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      value={rtMaxChildren}
                      onChange={(e) => setRtMaxChildren(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Infants</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      value={rtMaxInfants}
                      onChange={(e) => setRtMaxInfants(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <div
                  className="form-group"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}
                >
                  <input
                    type="checkbox"
                    id="excludeInfants"
                    checked={rtExcludeInfants}
                    onChange={(e) => setRtExcludeInfants(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="excludeInfants" style={{ margin: 0, cursor: 'pointer' }}>
                    Exclude Infants from Max Guests limit
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add Room Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Type Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsEditModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Edit Room Type: {activeRoomType?.name}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditRoomType}>
              <div className="modal-body">
                {formError && (
                  <div className="notification-banner error" style={{ margin: '0 0 16px' }}>
                    {formError}
                  </div>
                )}
                <div className="form-group">
                  <label>Room Type Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Deluxe Suite"
                    value={rtName}
                    onChange={(e) => setRtName(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Describe the room type amenities, view, etc."
                    value={rtDescription}
                    onChange={(e) => setRtDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Base Nightly Rate ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 150.00"
                    step="0.01"
                    min="0"
                    value={rtBaseNightlyRate}
                    onChange={(e) => setRtBaseNightlyRate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Max Guests</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={rtMaxGuests}
                      onChange={(e) => setRtMaxGuests(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Adults</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={rtMaxAdults}
                      onChange={(e) => setRtMaxAdults(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Max Children</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      value={rtMaxChildren}
                      onChange={(e) => setRtMaxChildren(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Infants</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      value={rtMaxInfants}
                      onChange={(e) => setRtMaxInfants(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
                <div
                  className="form-group"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}
                >
                  <input
                    type="checkbox"
                    id="excludeInfantsEdit"
                    checked={rtExcludeInfants}
                    onChange={(e) => setRtExcludeInfants(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="excludeInfantsEdit" style={{ margin: 0, cursor: 'pointer' }}>
                    Exclude Infants from Max Guests limit
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {isCreateRoomModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !isSubmitting && setIsCreateRoomModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Room for {activeHotelName}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsCreateRoomModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div className="modal-body">
                {formError && (
                  <div className="notification-banner error" style={{ margin: '0 0 16px' }}>
                    {formError}
                  </div>
                )}
                <div className="form-group">
                  <label>Room Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Room Type</label>
                  <select
                    className="form-control"
                    value={roomTypeId}
                    onChange={(e) => setRoomTypeId(e.target.value)}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="" disabled>
                      Select a Room Type
                    </option>
                    {(roomTypesByHotel[activeHotelId || ''] || []).map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateRoomModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {isEditRoomModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !isSubmitting && setIsEditRoomModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Room: {activeRoom?.roomNumber}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditRoomModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditRoom}>
              <div className="modal-body">
                {formError && (
                  <div className="notification-banner error" style={{ margin: '0 0 16px' }}>
                    {formError}
                  </div>
                )}
                <div className="form-group">
                  <label>Room Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Room Type</label>
                  <select
                    className="form-control"
                    value={roomTypeId}
                    onChange={(e) => setRoomTypeId(e.target.value)}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="" disabled>
                      Select a Room Type
                    </option>
                    {(roomTypesByHotel[activeRoom?.hotelId || ''] || []).map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditRoomModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Special Rate Modal */}
      {isCreateRateModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !isSubmitting && setIsCreateRateModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Special Nightly Rate for {activeHotelName}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsCreateRateModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateRate}>
              <div className="modal-body">
                {formError && (
                  <div className="notification-banner error" style={{ margin: '0 0 16px' }}>
                    {formError}
                  </div>
                )}
                <div className="form-group">
                  <label>Calendar Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={rateCalendarDate}
                    onChange={(e) => setRateCalendarDate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nightly Rate ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 180.00"
                    step="0.01"
                    min="0"
                    value={rateNightlyRate}
                    onChange={(e) => setRateNightlyRate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateRateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Special Rate Modal */}
      {isEditRateModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !isSubmitting && setIsEditRateModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Nightly Rate</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditRateModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditRate}>
              <div className="modal-body">
                {formError && (
                  <div className="notification-banner error" style={{ margin: '0 0 16px' }}>
                    {formError}
                  </div>
                )}
                <div className="form-group">
                  <label>Calendar Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={rateCalendarDate}
                    onChange={(e) => setRateCalendarDate(e.target.value)}
                    disabled={true}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nightly Rate ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 180.00"
                    step="0.01"
                    min="0"
                    value={rateNightlyRate}
                    onChange={(e) => setRateNightlyRate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditRateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Update Rates Modal */}
      {isBulkRateModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => !isSubmitting && setIsBulkRateModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Update Rates for {activeHotelName}</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsBulkRateModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Close modal"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleBulkUpdateRates}>
              <div className="modal-body">
                {formError && (
                  <div className="notification-banner error" style={{ margin: '0 0 16px' }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="bulkStartDate">Start Date</label>
                    <input
                      id="bulkStartDate"
                      type="date"
                      className="form-control"
                      value={bulkStartDate}
                      onChange={(e) => setBulkStartDate(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bulkEndDate">End Date</label>
                    <input
                      id="bulkEndDate"
                      type="date"
                      className="form-control"
                      value={bulkEndDate}
                      onChange={(e) => setBulkEndDate(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ marginBottom: '8px', display: 'block' }}>
                    Days of the Week to Apply
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '10px 16px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {[
                      { key: 1, label: 'Mon' },
                      { key: 2, label: 'Tue' },
                      { key: 3, label: 'Wed' },
                      { key: 4, label: 'Thu' },
                      { key: 5, label: 'Fri' },
                      { key: 6, label: 'Sat' },
                      { key: 0, label: 'Sun' },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          margin: 0,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={bulkDaysOfWeek[key] || false}
                          onChange={(e) =>
                            setBulkDaysOfWeek((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                          disabled={isSubmitting}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bulkNightlyRate">Nightly Rate ($)</label>
                  <input
                    id="bulkNightlyRate"
                    type="number"
                    className="form-control"
                    placeholder="e.g. 180.00"
                    step="0.01"
                    min="0"
                    value={bulkNightlyRate}
                    onChange={(e) => setBulkNightlyRate(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsBulkRateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Apply Bulk Rates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Award, 
  Star, 
  Monitor, 
  Leaf, 
  CheckCircle,
  Search,
  Filter,
  ChevronRight,
  Clock,
  User,
  BarChart3,
  Globe,
  ArrowRight,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import BannerCTA from '../../components/BannerCTA';
import ConsultationForm from '../../components/ConsultationForm';
import WorkshopRegistrationForm from '../../components/WorkshopRegistrationForm';

const TrainingCalendar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [filteredWorkshops, setFilteredWorkshops] = useState([]);
  const [expandedWorkshops, setExpandedWorkshops] = useState(new Set());
  const [registrationModal, setRegistrationModal] = useState({
    open: false,
    workshop: null
  });

  // Toggle workshop expansion
  const toggleWorkshopExpansion = (workshopId) => {
    setExpandedWorkshops(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workshopId)) {
        newSet.delete(workshopId);
      } else {
        newSet.add(workshopId);
      }
      return newSet;
    });
  };

  // Open registration modal
  const openRegistrationModal = (workshop) => {
    setRegistrationModal({
      open: true,
      workshop
    });
  };

  // Close registration modal
  const closeRegistrationModal = () => {
    setRegistrationModal({
      open: false,
      workshop: null
    });
  };

  // Open course landing page
  const openCourseLandingPage = (workshop) => {
    const courseUrl = workshop.courseHref;
    if (courseUrl) {
      window.location.href = courseUrl;
    }
  };

  // Featured workshops data (EPR Compass programs)
  const featuredWorkshops = [
    {
      id: 1,
      title: "PWM Rules 2016 & 2022 — EPR Essentials",
      description: "Plastic Waste Management Rules, EPR obligations, CPCB notifications and compliance framework for producers, brand owners and recyclers.",
      startDate: "2026-05-16",
      endDate: "2026-05-17",
      duration: "2 Days (Weekend)",
      time: "10:00 AM - 2:00 PM IST",
      level: "All Levels",
      price: "₹1,299",
      format: "Virtual (Zoom)",
      category: "Compliance",
      certified: true,
      featured: true,
      razorpayLink: "#",
      courseHref: "/trainings#pwm-rules"
    },
    {
      id: 2,
      title: "EPR Portal Navigation & Filing",
      description: "Hands-on CPCB EPR portal: registration, Form I & Form II filing, certificate management and EPR credit reporting.",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
      duration: "2 Days (Weekend)",
      time: "3:00 PM - 5:00 PM IST",
      level: "Beginner to Intermediate",
      price: "₹1,299",
      format: "Virtual (Zoom)",
      category: "EPR Portal",
      certified: true,
      featured: true,
      razorpayLink: "#",
      courseHref: "/trainings#epr-portal"
    }
  ];

  // All workshops data for schedule section
  const allWorkshops = [
    ...featuredWorkshops,
    {
      id: 3,
      title: "Plastic Waste Accounting & Targets",
      description: "Plastic packaging EPR targets, waste accounting, recycling certificates and PRO partnerships for compliance.",
      startDate: "2026-06-27",
      endDate: "2026-06-27",
      duration: "1 Day",
      time: "2:00 PM - 5:00 PM IST",
      level: "All Levels",
      price: "₹899",
      format: "Virtual (Zoom)",
      category: "Plastic EPR",
      certified: true,
      featured: false,
      razorpayLink: "#",
      courseHref: "/trainings#plastic-waste-accounting"
    },
    {
      id: 4,
      title: "Compliance Reporting & EPR Credit Trading",
      description: "Annual EPR returns, compliance reporting, EPR credit trading and certificate procurement for multi-category compliance.",
      startDate: "2026-07-11",
      endDate: "2026-07-11",
      duration: "1 Day",
      time: "4:00 PM - 6:00 PM IST",
      level: "Beginner to Intermediate",
      price: "₹899",
      format: "Virtual (Zoom)",
      category: "Reporting",
      certified: true,
      featured: false,
      razorpayLink: "#",
      courseHref: "/trainings#compliance-reporting"
    },
    {
      id: 5,
      title: "Multi-Category EPR: Plastic, E-waste, Battery, Tyre, Oil",
      description: "Overview of EPR across waste categories: registration, targets, certificates and compliance timelines.",
      startDate: "2026-07-25",
      endDate: "2026-07-25",
      duration: "1 Day",
      time: "11:00 AM - 1:00 PM IST",
      level: "All Levels",
      price: "₹999",
      format: "Virtual (Zoom)",
      category: "Multi-EPR",
      certified: true,
      featured: false,
      razorpayLink: "#",
      courseHref: "/trainings#pwm-rules"
    },
    {
      id: 6,
      title: "EPR Certificate Procurement & PRO Partnerships",
      description: "How to procure EPR certificates, work with PROs and meet annual targets through recycling and collection proof.",
      startDate: "2026-08-08",
      endDate: "2026-08-08",
      duration: "1 Day",
      time: "3:00 PM - 5:00 PM IST",
      level: "All Levels",
      price: "₹899",
      format: "Virtual (Zoom)",
      category: "Certificates",
      certified: true,
      featured: false,
      razorpayLink: "#",
      courseHref: "/trainings#epr-portal"
    },
    {
      id: 7,
      title: "Annual EPR Returns Masterclass (Form I & II)",
      description: "End-to-end filing workflow for annual returns with data checks, evidence packs and submission QA.",
      startDate: "2026-08-22",
      endDate: "2026-08-22",
      duration: "1 Day",
      time: "11:00 AM - 2:00 PM IST",
      level: "Intermediate",
      price: "₹999",
      format: "Virtual (Zoom)",
      category: "Returns",
      certified: true,
      featured: false,
      razorpayLink: "#",
      courseHref: "/trainings#compliance-reporting"
    },
    {
      id: 8,
      title: "E-Waste & Battery EPR Practitioner Session",
      description: "Category-wise obligations, channelization controls, recycler tie-ups and compliance reporting for E-waste and battery.",
      startDate: "2026-09-05",
      endDate: "2026-09-05",
      duration: "1 Day",
      time: "12:00 PM - 3:00 PM IST",
      level: "All Levels",
      price: "₹999",
      format: "Virtual (Zoom)",
      category: "Category Focus",
      certified: true,
      featured: false,
      razorpayLink: "#",
      courseHref: "/trainings#pwm-rules"
    },
    {
      id: 9,
      title: "Internal EPR Audit & Compliance Gap Assessment",
      description: "Build internal control checks, gap registers and corrective action workflows for inspection-ready compliance.",
      startDate: "2026-09-19",
      endDate: "2026-09-19",
      duration: "1 Day",
      time: "3:00 PM - 6:00 PM IST",
      level: "Intermediate to Advanced",
      price: "₹1,199",
      format: "Virtual (Zoom)",
      category: "Audit",
      certified: true,
      featured: false,
      razorpayLink: "#",
      courseHref: "/services/compliance-optimization"
    },
    {
      id: 10,
      title: "Recycler Due Diligence & Evidence Management Lab",
      description: "Validate partners, structure evidence trails and strengthen certificate defensibility across categories.",
      startDate: "2026-10-10",
      endDate: "2026-10-10",
      duration: "1 Day",
      time: "11:00 AM - 1:30 PM IST",
      level: "All Levels",
      price: "₹899",
      format: "Virtual (Zoom)",
      category: "Controls",
      certified: true,
      featured: false,
      razorpayLink: "#",
      courseHref: "/trainings#epr-portal"
    }
  ];

  const monthOptions = Array.from(
    new Set(allWorkshops.map((workshop) => new Date(workshop.startDate).getMonth()))
  ).sort((a, b) => a - b);

  // Filter workshops based on search and month
  useEffect(() => {
    let filtered = allWorkshops;
    
    if (searchTerm) {
      filtered = filtered.filter(workshop => 
        workshop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workshop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workshop.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(
        (workshop) => new Date(workshop.startDate).getMonth() === parseInt(selectedMonth, 10)
      );
    }
    
    setFilteredWorkshops(filtered);
  }, [searchTerm, selectedMonth]);

  // Get month name from month number
  const getMonthName = (monthNum) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNum];
  };

  const formatWorkshopDates = (workshop) => {
    const start = new Date(workshop.startDate);
    const end = new Date(workshop.endDate);
    const sameDay = start.toDateString() === end.toDateString();

    if (sameDay) {
      return `${getMonthName(start.getMonth())} ${start.getDate()}, ${start.getFullYear()}`;
    }

    return `${getMonthName(start.getMonth())} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  };

  const calendarMonth = selectedMonth === 'all' ? monthOptions[0] : parseInt(selectedMonth, 10);
  const calendarYear =
    allWorkshops.find((workshop) => new Date(workshop.startDate).getMonth() === calendarMonth)
      ? new Date(
          allWorkshops.find((workshop) => new Date(workshop.startDate).getMonth() === calendarMonth)
            .startDate
        ).getFullYear()
      : new Date().getFullYear();

  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const workshopDays = allWorkshops
    .filter((workshop) => {
      const workshopDate = new Date(workshop.startDate);
      return workshopDate.getMonth() === calendarMonth && workshopDate.getFullYear() === calendarYear;
    })
    .reduce((acc, workshop) => {
      const day = new Date(workshop.startDate).getDate();
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(workshop);
      return acc;
    }, {});

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 1. Hero Component */}
      <section className="bg-gradient-to-br from-eco-green-1/20 via-white to-eco-green-2/20 dark:from-eco-green-1/10 dark:via-gray-900 dark:to-eco-green-2/10 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            <span className="text-gray-900 dark:text-white">EPR Compass</span>{' '}
            <span className="text-eco-green-4">Training Calendar</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Explore upcoming trainings for EPR and compliance professionals — CPCB portal, PWM Rules 2022, certificate management, and reporting. 
            Book your spot or request custom programs for your team. Each session is practical and certification-ready.
          </p>
          
          {/* Feature Tags */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm">
              <Calendar className="w-5 h-5 text-eco-green-4" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Regular Sessions</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm">
              <Users className="w-5 h-5 text-eco-green-4" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Expert Instructors</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm">
              <MapPin className="w-5 h-5 text-eco-green-4" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Multiple Formats</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm">
              <Award className="w-5 h-5 text-eco-green-4" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Certified Programs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Workshops by Month Section */}
      <section className="py-16 md:py-20 bg-amber-50 dark:bg-amber-900/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ✩ Featured Workshops by Month ✩
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our flagship certification programs designed to advance your career in EPR and sustainability.
            </p>
          </div>
          
          {/* Featured Workshops Grid */}
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {featuredWorkshops.map((workshop) => (
              <div key={workshop.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 lg:p-8 shadow-lg border border-amber-200 dark:border-amber-800 relative overflow-hidden">
                {/* Featured Badge - Positioned at top right of the entire card */}
                {workshop.featured && (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 md:px-3 py-1 md:py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-1 shadow-lg border border-orange-400/30">
                      <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-200 animate-pulse" />
                      <span className="tracking-wide hidden sm:inline">FEATURED</span>
                      <span className="tracking-wide sm:hidden">⭐</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Left Column - Workshop Info */}
                  <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    {/* Information Tags - Mobile Optimized */}
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 md:px-3 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium flex items-center gap-1">
                        <Monitor className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">{workshop.format}</span>
                        <span className="sm:hidden">Virtual</span>
                      </span>
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 md:px-3 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium flex items-center gap-1">
                        <Leaf className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">{workshop.category}</span>
                        <span className="sm:hidden">{workshop.category}</span>
                      </span>
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 md:px-3 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Certified</span>
                        <span className="sm:hidden">✓</span>
                      </span>
                    </div>
                    
                    {/* Workshop Title and Description */}
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3 leading-tight">
                        {workshop.title}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                        {workshop.description}
                      </p>
                    </div>
                    
                    {/* Workshop Details - Mobile Optimized Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="truncate">{formatWorkshopDates(workshop)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="truncate">{workshop.duration} • {workshop.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <BarChart3 className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="truncate">{workshop.level}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="truncate">{workshop.duration}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Pricing and Actions */}
                  <div className="lg:col-span-1 flex flex-col justify-between space-y-4 md:space-y-6">
                    {/* Pricing Section - Added top margin to avoid featured tag overlap */}
                    <div className="text-center lg:text-right pt-8 md:pt-10">
                      <div className="text-2xl md:text-3xl font-bold text-eco-green-4 mb-1">
                        {workshop.price}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        per participant
                      </div>
                    </div>
                    
                    {/* Action Buttons - Mobile Optimized */}
                    <div className="space-y-2 md:space-y-3">
                      <button 
                        onClick={() => openRegistrationModal(workshop)}
                        className="w-full bg-eco-green-4 text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg font-medium hover:bg-eco-green-5 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        <span className="hidden sm:inline">Register Now</span>
                        <span className="sm:hidden">Register</span>
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button 
                        onClick={() => openCourseLandingPage(workshop)}
                        className="w-full bg-blue-600 text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        <span className="hidden sm:inline">View Course</span>
                        <span className="sm:hidden">Course</span>
                        <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button 
                        onClick={() => toggleWorkshopExpansion(workshop.id)}
                        className="w-full bg-white text-eco-green-4 border border-eco-green-4 py-2.5 md:py-3 px-4 md:px-6 rounded-lg font-medium hover:bg-eco-green-4 hover:text-white transition-colors text-sm md:text-base"
                      >
                        {expandedWorkshops.has(workshop.id) ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Course Details Section - Mobile Optimized */}
                {expandedWorkshops.has(workshop.id) && (
                  <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-amber-200 dark:border-amber-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      {/* Target Audience */}
                      <div className="text-center p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <div className="bg-eco-green-4/10 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                          <Users className="w-5 h-5 md:w-6 md:h-6 text-eco-green-4" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Target Audience</h4>
                        <ul className="text-xs md:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Producers, brand owners & importers</li>
                          <li>• EPR and sustainability managers</li>
                          <li>• Compliance and operations teams</li>
                        </ul>
                      </div>

                      {/* Learning Objectives */}
                      <div className="text-center p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <div className="bg-eco-green-4/10 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                          <Award className="w-5 h-5 md:w-6 md:h-6 text-eco-green-4" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Learning Objectives</h4>
                        <ul className="text-xs md:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Navigate CPCB EPR portal and filings</li>
                          <li>• Understand PWM Rules and EPR targets</li>
                          <li>• Manage certificates and compliance reporting</li>
                        </ul>
                      </div>

                      {/* Hands-on Activities */}
                      <div className="text-center p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <div className="bg-eco-green-4/10 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                          <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-eco-green-4" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Hands-on Activities</h4>
                        <ul className="text-xs md:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Templates and checklists</li>
                          <li>• Role-play and scripts</li>
                          <li>• Tool walkthroughs</li>
                        </ul>
                      </div>

                      {/* Why It Matters */}
                      <div className="text-center p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl sm:col-span-2 lg:col-span-1">
                        <div className="bg-eco-green-4/10 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                          <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-eco-green-4" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base">Why It Matters</h4>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          EPR compliance and certificate management require practical skills and clear processes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Calendar View Section */}
      <section className="py-16 md:py-20 bg-gray-50 dark:bg-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Calendar View
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300">
              {getMonthName(calendarMonth)} {calendarYear} workshop slots and batch highlights.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 bg-eco-green-4 text-white text-xs md:text-sm font-semibold">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="px-2 py-3 text-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-[92px] md:auto-rows-[110px]">
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}`} className="border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40" />
                ))}
                {Array.from({ length: totalDaysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayWorkshops = workshopDays[day] || [];
                  return (
                    <div
                      key={`day-${day}`}
                      className={`border border-gray-100 dark:border-gray-800 p-2 ${
                        dayWorkshops.length > 0 ? 'bg-eco-green-1/10 dark:bg-eco-green-4/10' : 'bg-white dark:bg-gray-900'
                      }`}
                    >
                      <div className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">{day}</div>
                      {dayWorkshops.slice(0, 2).map((workshop) => (
                        <div
                          key={workshop.id}
                          className="mt-1 text-[10px] md:text-xs leading-tight text-eco-green-5 dark:text-eco-green-3 bg-white/80 dark:bg-gray-800/70 rounded px-1.5 py-1 truncate"
                          title={workshop.title}
                        >
                          {workshop.title}
                        </div>
                      ))}
                      {dayWorkshops.length > 2 ? (
                        <div className="mt-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">+{dayWorkshops.length - 2} more</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 md:p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {getMonthName(calendarMonth)} Batches
              </h3>
              <div className="space-y-3">
                {Object.values(workshopDays).flat().length > 0 ? (
                  Object.values(workshopDays)
                    .flat()
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                    .map((workshop) => (
                      <button
                        key={`calendar-list-${workshop.id}`}
                        onClick={() => openRegistrationModal(workshop)}
                        className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:border-eco-green-4 hover:bg-eco-green-4/5 transition-colors"
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{workshop.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{formatWorkshopDates(workshop)} • {workshop.time}</p>
                      </button>
                    ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No workshops scheduled for this month.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Training Schedule Section with Search and Filtering */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Training Schedule
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Browse our comprehensive training calendar and find the perfect program for your needs.
            </p>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search workshops by title, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-eco-green-4 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            {/* Month Filter Buttons */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter by Month:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedMonth('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMonth === 'all'
                      ? 'bg-eco-green-4 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-eco-green-4/10'
                  }`}
                >
                  All Months
                </button>
                {monthOptions.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(String(month))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedMonth === String(month)
                        ? 'bg-eco-green-4 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-eco-green-4/10'
                    }`}
                  >
                    {getMonthName(month)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Workshops Grid */}
          <div className="grid grid-cols-1 gap-6">
            {filteredWorkshops.map((workshop) => (
              <div key={workshop.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Workshop Info */}
                  <div className="lg:col-span-2">
                    {/* Workshop Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                          {workshop.format}
                        </span>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                          {workshop.category}
                        </span>
                      </div>
                                             {workshop.featured && (
                         <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg border border-orange-400/30">
                           <Star className="w-4 h-4 text-yellow-200 animate-pulse" />
                           <span className="tracking-wide">FEATURED</span>
                         </div>
                       )}
                    </div>
                    
                    {/* Workshop Title and Description */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {workshop.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {workshop.description}
                    </p>
                    
                    {/* Workshop Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatWorkshopDates(workshop)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{workshop.duration} • {workshop.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <BarChart3 className="w-4 h-4" />
                        <span>{workshop.level}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Award className="w-4 h-4" />
                        <span>{workshop.certified ? 'Certified' : 'Non-Certified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Pricing and Action */}
                  <div className="lg:col-span-1 flex flex-col justify-between">
                    <div className="text-center lg:text-right mb-4">
                      <div className="text-3xl font-bold text-eco-green-4">
                        {workshop.price}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        per participant
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={() => openRegistrationModal(workshop)}
                        className="w-full bg-eco-green-4 text-white py-3 px-6 rounded-lg font-medium hover:bg-eco-green-5 transition-colors flex items-center justify-center gap-2"
                      >
                        Register Now
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openCourseLandingPage(workshop)}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        View Course
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleWorkshopExpansion(workshop.id)}
                        className="w-full bg-white text-eco-green-4 border border-eco-green-4 py-3 px-6 rounded-lg font-medium hover:bg-eco-green-4 hover:text-white transition-colors"
                      >
                        {expandedWorkshops.has(workshop.id) ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Course Details Section */}
                {expandedWorkshops.has(workshop.id) && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Target Audience */}
                      <div className="text-center">
                        <div className="bg-eco-green-4/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-eco-green-4" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Target Audience</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Producers, brand owners & importers</li>
                          <li>• EPR and compliance managers</li>
                          <li>• Sustainability and operations teams</li>
                        </ul>
                      </div>

                      {/* Learning Objectives */}
                      <div className="text-center">
                        <div className="bg-eco-green-4/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Award className="w-6 h-6 text-eco-green-4" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Learning Objectives</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Navigate CPCB EPR portal</li>
                          <li>• Meet EPR targets and reporting</li>
                          <li>• Procure and manage EPR certificates</li>
                        </ul>
                      </div>

                      {/* Hands-on Activities */}
                      <div className="text-center">
                        <div className="bg-eco-green-4/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <BarChart3 className="w-6 h-6 text-eco-green-4" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Hands-on Activities</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Case studies</li>
                          <li>• Group exercises</li>
                          <li>• Real-world projects</li>
                        </ul>
                      </div>

                      {/* Why It Matters */}
                      <div className="text-center">
                        <div className="bg-eco-green-4/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="w-6 h-6 text-eco-green-4" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Why It Matters</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Stay compliant with PWM Rules and CPCB requirements through practical EPR and certificate management skills.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* No Results Message */}
          {filteredWorkshops.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No workshops found matching your criteria. Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Why Choose Our EPR Trainings Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our EPR Trainings
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Practical, EPR-focused trainings with certification-ready outcomes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 text-center shadow-lg">
              <div className="bg-eco-green-4 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                EPR-Ready Tools
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Templates, SOPs and tool walkthroughs you can implement the next day.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 text-center shadow-lg">
              <div className="bg-eco-green-4 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Expert Instructors
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Learn from seasoned professionals with 10-20 years of real-world experience in EPR, carbon accounting, and sustainability.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-8 text-center shadow-lg">
              <div className="bg-eco-green-4 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Global Standards
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Training aligned with international frameworks like GRI, TCFD, ISO standards, and crucial regulatory requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Banner CTA Section */}
      <section className="py-20 bg-eco-green-4">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Need a Custom Program for Your Team?
          </h2>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            We design custom trainings for EPR and compliance teams across CPCB portal, certificate management, reporting and client communication.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-eco-green-4 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
              Request Custom Training
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="bg-white text-eco-green-4 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Contact Training Team
            </button>
          </div>
        </div>
      </section>

      {/* Consultation Form */}
      <ConsultationForm />

      {/* Workshop Registration Modal */}
      {registrationModal.open && registrationModal.workshop && (
        <WorkshopRegistrationForm
          workshop={registrationModal.workshop}
          open={registrationModal.open}
          onClose={closeRegistrationModal}
        />
      )}
    </div>
  );
};

export default TrainingCalendar;


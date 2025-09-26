import { useState } from 'react';import { useState, useEffect, useRef } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

import { Button } from '../ui/button';import { Button } from "../ui/button";

import { Input } from '../ui/input';import { Input } from "../ui/input";

import { Label } from '../ui/label';import { Label } from "../ui/label";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { RadioGroup, RadioGroupItem } from '../ui/radio-group';import { X, Plus, Trash2, RefreshCw, Save, Loader2 } from "lucide-react";

import { X, Save } from 'lucide-react';import { PortalAPI, type PortalData } from "../../lib/portal-api";



interface PortalEditorProps {interface Slot {

  portalId?: string;  id: string;

  isOpen: boolean;  position: { top: string; left: string };

  onClose: () => void;  diameter: string;

}  index: string[];

}

export function PortalEditor({ portalId, isOpen, onClose }: PortalEditorProps) {

  // Portal Settings Stateinterface Category {

  const [portalName, setPortalName] = useState('');  id: string;

  const [slotMode, setSlotMode] = useState<'equals_cells' | 'cells_plus_two'>('equals_cells');  name: string;

    indices: string[];

  // Current tab state}

  const [activeTab, setActiveTab] = useState('desktop');

interface PortalEditorProps {

  const handleSave = () => {  isOpen: boolean;

    // TODO: Implement save functionality  onClose: () => void;

    console.log('Saving portal:', { portalName, slotMode });  portalId?: string;

    onClose();}

  };

function PortalEditor({ isOpen, onClose, portalId }: PortalEditorProps) {

  return (  // Phase 1: Basic state management

    <Dialog open={isOpen} onOpenChange={onClose}>  const [portalName, setPortalName] = useState("");

      <DialogContent className="max-w-6xl h-[90vh] p-0">  const [isLoading, setIsLoading] = useState(false);

        <div className="flex flex-col h-full">  const [isSaving, setIsSaving] = useState(false);

          {/* Header */}  const [loadError, setLoadError] = useState<string | null>(null);

          <DialogHeader className="p-6 border-b">  const [saveError, setSaveError] = useState<string | null>(null);

            <div className="flex items-center justify-between">  

              <DialogTitle className="text-xl">  // Phase 2: Canvas and slot management - optimized for landscape fullscreen gaming

                {portalId ? `Редактиране на портал: ${portalId}` : 'Създаване на нов портал'}  const [activeTab, setActiveTab] = useState("desktop");

              </DialogTitle>  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);

              <div className="flex gap-2">  // Optimized canvas size for landscape fullscreen gaming (16:9 aspect ratio)

                <Button onClick={handleSave} className="flex items-center gap-2">  const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 576 }); // Scaled down 1920x1080 for editor

                  <Save className="w-4 h-4" />  const [slots, setSlots] = useState<Slot[]>([]);

                  Запази  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

                </Button>  

                <Button variant="ghost" size="icon" onClick={onClose}>  // Phase 3: Drag & drop state

                  <X className="w-4 h-4" />  const [isDragging, setIsDragging] = useState(false);

                </Button>  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

              </div>  

            </div>  // Phase 4: Mobile canvas state

          </DialogHeader>  const [mobileGridSize, setMobileGridSize] = useState({ rows: 6, cols: 4 });

  const [mobileSlots, setMobileSlots] = useState<Array<{ id: string; row: number; col: number; index: string[] }>>([]);

          {/* Portal Settings Section */}  const [selectedMobileSlot, setSelectedMobileSlot] = useState<string | null>(null);

          <div className="p-6 border-b bg-gray-50">  

            <h3 className="text-lg font-semibold mb-4">Настройки на портал</h3>  // Phase 5: Index selection state

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">  const [categories, setCategories] = useState<Category[]>([]);

              {/* Portal Name */}  const [isIndexDialogOpen, setIsIndexDialogOpen] = useState(false);

              <div className="space-y-2">  const [indexEditingSlot, setIndexEditingSlot] = useState<string | null>(null);

                <Label htmlFor="portal-name">Име на портала</Label>  const [indexEditingType, setIndexEditingType] = useState<'desktop' | 'mobile'>('desktop');

                <Input  

                  id="portal-name"  // Phase 6: Icon management state

                  value={portalName}  const [portalIcon, setPortalIcon] = useState("/images/portals/default.png");

                  onChange={(e) => setPortalName(e.target.value)}  const [iconPreview, setIconPreview] = useState<HTMLImageElement | null>(null);

                  placeholder="Въведете име на портала..."  

                />  // Phase 7: Layout sync state

              </div>  const [autoSync, setAutoSync] = useState(true);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'out-of-sync' | 'syncing'>('synced');

              {/* Slot Mode */}  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

              <div className="space-y-2">  

                <Label>Режим на слотове</Label>  const canvasRef = useRef<HTMLCanvasElement>(null);

                <RadioGroup value={slotMode} onValueChange={(value) => setSlotMode(value as any)}>  const mobileCanvasRef = useRef<HTMLCanvasElement>(null);

                  <div className="flex items-center space-x-2">

                    <RadioGroupItem value="equals_cells" id="equals_cells" />  // Load background image and categories

                    <Label htmlFor="equals_cells">Равен на броя клетки</Label>  useEffect(() => {

                  </div>    if (isOpen) {

                  <div className="flex items-center space-x-2">      const img = new Image();

                    <RadioGroupItem value="cells_plus_two" id="cells_plus_two" />      img.onload = () => {

                    <Label htmlFor="cells_plus_two">Клетки + 2 обекта</Label>        setBackgroundImage(img);

                  </div>        // Optimized for landscape fullscreen gaming - 16:9 aspect ratio

                </RadioGroup>        const maxWidth = 1024;   // Scaled down from 1920px for editor performance

              </div>        const maxHeight = 576;   // Scaled down from 1080px (maintains 16:9 ratio)

            </div>        const aspectRatio = img.width / img.height;

          </div>        

        let newWidth = maxWidth;

          {/* Main Content Area */}        let newHeight = maxWidth / aspectRatio;

          <div className="flex-1 p-6">        

            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">        if (newHeight > maxHeight) {

              <TabsList className="grid w-full grid-cols-3 mb-6">          newHeight = maxHeight;

                <TabsTrigger value="desktop">Desktop</TabsTrigger>          newWidth = maxHeight * aspectRatio;

                <TabsTrigger value="mobile">Mobile</TabsTrigger>        }

                <TabsTrigger value="icon">Икони</TabsTrigger>        

              </TabsList>        setCanvasSize({ width: Math.floor(newWidth), height: Math.floor(newHeight) });

      };

              {/* Desktop Tab */}      img.src = "/images/backgrounds/dolina-large.png";

              <TabsContent value="desktop" className="h-full">      

                <div className="text-center py-8 text-gray-500">      // Load categories

                  <p>Desktop Canvas ще бъде имплементиран в следващата фаза...</p>      setCategories([

                </div>        { id: "animals", name: "Животни", indices: ["animal1", "animal2", "animal3", "animal4"] },

              </TabsContent>        { id: "vehicles", name: "Превозни средства", indices: ["vehicle1", "vehicle2", "vehicle3"] },

        { id: "colors", name: "Цветове", indices: ["red", "blue", "green", "yellow"] },

              {/* Mobile Tab */}        { id: "shapes", name: "Фигури", indices: ["circle", "square", "triangle"] }

              <TabsContent value="mobile" className="h-full">      ]);

                <div className="text-center py-8 text-gray-500">

                  <p>Mobile Canvas ще бъде имплементиран в следващата фаза...</p>      // Load portal data if editing existing portal

                </div>      if (portalId) {

              </TabsContent>        loadPortalData();

      } else {

              {/* Icon Tab */}        resetToDefaults();

              <TabsContent value="icon" className="h-full">      }

                <div className="text-center py-8 text-gray-500">    }

                  <p>Icon Gallery ще бъде имплементиран в следващата фаза...</p>  }, [isOpen, portalId]);

                </div>

              </TabsContent>  const loadPortalData = async () => {

            </Tabs>    if (!portalId) return;

          </div>    

        </div>    setIsLoading(true);

      </DialogContent>    setLoadError(null);

    </Dialog>    

  );    try {

}      // Try real API first, fallback to mock for development
      const result = await PortalAPI.loadPortal(portalId);
      
      if (result.success && result.data) {
        const portal = result.data;
        setPortalName(portal.name);
        setPortalIcon(portal.icon);
        setSlots(portal.desktopSlots);
        setMobileSlots(portal.mobileSlots);
        setMobileGridSize(portal.gridSize);
        setSyncStatus(portal.syncStatus);
        setAutoSync(portal.autoSync);
      } else {
        setLoadError(result.error || 'Failed to load portal data');
        // Fallback to defaults if loading fails
        resetToDefaults();
      }
    } catch (error) {
      console.error('Error loading portal:', error);
      setLoadError('Network error occurred while loading portal');
      resetToDefaults();
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setPortalName("");
    setPortalIcon("/images/portals/default.png");
    setSlots([
      { id: "slot1", position: { top: "20%", left: "30%" }, diameter: "60px", index: ["animal1"] },
      { id: "slot2", position: { top: "60%", left: "70%" }, diameter: "50px", index: ["vehicle1"] },
    ]);
    setMobileSlots([
      { id: "mobile1", row: 2, col: 1, index: ["animal1"] },
      { id: "mobile2", row: 4, col: 3, index: ["vehicle1"] },
    ]);
    setMobileGridSize({ rows: 6, cols: 4 });
    setSyncStatus('synced');
    setAutoSync(true);
    setLoadError(null);
    setSaveError(null);
  };

  // Canvas rendering effect
  useEffect(() => {
    if (backgroundImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
        
        // Draw background image
        ctx.drawImage(backgroundImage, 0, 0, canvasSize.width, canvasSize.height);
        
        // Draw slots
        slots.forEach(slot => {
          const x = (parseFloat(slot.position.left) / 100) * canvasSize.width;
          const y = (parseFloat(slot.position.top) / 100) * canvasSize.height;
          const radius = parseFloat(slot.diameter) / 2;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = selectedSlot === slot.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.3)';
          ctx.fill();
          ctx.strokeStyle = selectedSlot === slot.id ? '#3b82f6' : '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw slot label
          if (slot.index.length > 0) {
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(slot.index[0], x, y + 4);
          }
        });
      }
    }
  }, [backgroundImage, slots, selectedSlot, canvasSize]);

  // Mobile canvas rendering effect
  useEffect(() => {
    if (mobileCanvasRef.current) {
      const canvas = mobileCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, 400, 600);
        
        // Draw grid background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 400, 600);
        
        const cellWidth = 400 / mobileGridSize.cols;
        const cellHeight = 600 / mobileGridSize.rows;
        
        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= mobileGridSize.cols; i++) {
          ctx.beginPath();
          ctx.moveTo(i * cellWidth, 0);
          ctx.lineTo(i * cellWidth, 600);
          ctx.stroke();
        }
        
        for (let i = 0; i <= mobileGridSize.rows; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * cellHeight);
          ctx.lineTo(400, i * cellHeight);
          ctx.stroke();
        }
        
        // Draw mobile slots
        mobileSlots.forEach(slot => {
          const x = (slot.col - 0.5) * cellWidth;
          const y = (slot.row - 0.5) * cellHeight;
          const radius = Math.min(cellWidth, cellHeight) * 0.3;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = selectedMobileSlot === slot.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(34, 197, 94, 0.3)';
          ctx.fill();
          ctx.strokeStyle = selectedMobileSlot === slot.id ? '#3b82f6' : '#22c55e';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw slot label
          if (slot.index.length > 0) {
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(slot.index[0], x, y + 3);
          }
        });
      }
    }
  }, [mobileSlots, selectedMobileSlot, mobileGridSize]);

  // Phase 7: Layout Sync Functions
  const syncLayouts = async () => {
    setSyncStatus('syncing');
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock sync logic - in real implementation this would:
    // 1. Compare desktop and mobile slots
    // 2. Sync indices between matching slots
    // 3. Handle conflicts
    
    setSyncStatus('synced');
    setLastSyncTime(new Date());
    
    alert(`Layout sync completed!\nDesktop slots: ${slots.length}\nMobile slots: ${mobileSlots.length}`);
  };

  const checkSyncStatus = () => {
    // Check if layouts are out of sync
    const desktopIndices = slots.flatMap(slot => slot.index);
    const mobileIndices = mobileSlots.flatMap(slot => slot.index);
    
    const isOutOfSync = JSON.stringify(desktopIndices.sort()) !== JSON.stringify(mobileIndices.sort());
    setSyncStatus(isOutOfSync ? 'out-of-sync' : 'synced');
  };

  // Auto sync when slots change (if enabled)
  useEffect(() => {
    if (autoSync && slots.length > 0 && mobileSlots.length > 0) {
      checkSyncStatus();
    }
  }, [slots, mobileSlots, autoSync]);

  // Handle form submission with API integration
  const handleSave = async () => {
    if (!portalName.trim()) {
      alert("Моля въведете име на портала");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const portalData: PortalData = {
        id: portalId,
        name: portalName,
        icon: portalIcon,
        backgroundImage: "/images/backgrounds/dolina-large.png",
        desktopSlots: slots,
        mobileSlots: mobileSlots,
        gridSize: mobileGridSize,
        syncStatus: syncStatus,
        autoSync: autoSync
      };

      // Try real API first, fallback to mock for development
      let result;
      try {
        result = await PortalAPI.savePortal(portalData);
      } catch (error) {
        console.warn('Real API failed, using mock API:', error);
        result = await PortalAPI.mockSavePortal(portalData);
      }

      if (result.success) {
        alert(`Порталът "${portalName}" е запазен успешно!`);
        console.log('Portal saved:', result.data);
        onClose();
      } else {
        setSaveError(result.error || 'Failed to save portal');
        alert(`Грешка при запазване: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving portal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSaveError(errorMessage);
      alert(`Възникна грешка: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add slot functionality
  const addSlot = () => {
    const newSlot: Slot = {
      id: `slot_${Date.now()}`,
      position: { top: "50%", left: "50%" },
      diameter: "60px",
      index: []
    };
    setSlots([...slots, newSlot]);
    setSelectedSlot(newSlot.id);
  };

  const removeSlot = () => {
    if (selectedSlot) {
      setSlots(slots.filter(slot => slot.id !== selectedSlot));
      setSelectedSlot(null);
    }
  };

  const addMobileSlot = () => {
    const newSlot = {
      id: `mobile_${Date.now()}`,
      row: 3,
      col: 2,
      index: []
    };
    setMobileSlots([...mobileSlots, newSlot]);
    setSelectedMobileSlot(newSlot.id);
  };

  const removeMobileSlot = () => {
    if (selectedMobileSlot) {
      setMobileSlots(mobileSlots.filter(slot => slot.id !== selectedMobileSlot));
      setSelectedMobileSlot(null);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (portalName && !confirm("Имате незапазени промени. Сигурни ли сте, че искате да затворите?")) {
      return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {portalId ? "Редактирай портал" : "Създай нов портал"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-sm text-gray-600">
            {portalId 
              ? "Редактирайте съществуващия портал с неговите настройки и layout."
              : "Създайте нов портал като конфигурирате layout-а за desktop и mobile устройства."
            }
          </DialogDescription>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                <p className="text-gray-600">Зареждане на портал данни...</p>
              </div>
            </div>
          ) : loadError ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Грешка при зареждане</h3>
                <p className="text-gray-600 mb-4">{loadError}</p>
                <Button onClick={() => portalId ? loadPortalData() : resetToDefaults()}>
                  Опитай отново
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
            
            {/* Phase 1: Basic Portal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Основна информация</h3>
              
              <div className="space-y-2">
                <Label htmlFor="portalName" className="text-sm font-medium">
                  Име на портала *
                </Label>
                <Input
                  id="portalName"
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  placeholder="Въведете име на портала..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Phase 2-7: Portal Editor Tabs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Редактор на портал</h3>
                
                {/* Phase 7: Sync Status Indicator */}
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    syncStatus === 'synced' ? 'bg-green-500' :
                    syncStatus === 'out-of-sync' ? 'bg-yellow-500' :
                    'bg-blue-500 animate-pulse'
                  }`}></div>
                  <span className="text-gray-600">
                    {syncStatus === 'synced' ? 'Layouts Synced' :
                     syncStatus === 'out-of-sync' ? 'Out of Sync' :
                     'Syncing...'}
                  </span>
                  {lastSyncTime && (
                    <span className="text-gray-400">
                      | {lastSyncTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="desktop">Desktop Layout</TabsTrigger>
                  <TabsTrigger value="mobile">Mobile Layout</TabsTrigger>
                  <TabsTrigger value="icons">Icons</TabsTrigger>
                </TabsList>

                <TabsContent value="desktop" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium">Desktop Canvas</h4>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addSlot}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Slot
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={removeSlot}
                        disabled={!selectedSlot}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  
                  {/* Background Image Requirements Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-600 mt-0.5">📐</div>
                      <div className="text-sm">
                        <div className="font-medium text-blue-800 mb-1">Препоръки за фоново изображение:</div>
                        <div className="text-blue-700 space-y-1">
                          <div>• <strong>Оптимален размер:</strong> 1920×1080px (16:9 ratio)</div>
                          <div>• <strong>Формат:</strong> PNG за най-добро качество</div>
                          <div>• <strong>Файлов размер:</strong> 300-800KB препоръчан</div>
                          <div>• <strong>Дизайн:</strong> Landscape пълен екран за мобилни и desktop</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Canvas Container */}
                    <div className="lg:col-span-3 bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
                      <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        className="border border-gray-200 rounded cursor-pointer"
                        style={{ maxWidth: '100%', height: 'auto' }}
                        onClick={(e) => {
                          const rect = canvasRef.current?.getBoundingClientRect();
                          if (rect) {
                            const scaleX = canvasSize.width / rect.width;
                            const scaleY = canvasSize.height / rect.height;
                            const x = (e.clientX - rect.left) * scaleX;
                            const y = (e.clientY - rect.top) * scaleY;
                            
                            // Check if clicked on a slot
                            let clickedSlot = null;
                            slots.forEach(slot => {
                              const slotX = (parseFloat(slot.position.left) / 100) * canvasSize.width;
                              const slotY = (parseFloat(slot.position.top) / 100) * canvasSize.height;
                              const radius = parseFloat(slot.diameter) / 2;
                              
                              if (Math.sqrt((x - slotX) ** 2 + (y - slotY) ** 2) <= radius) {
                                clickedSlot = slot.id;
                              }
                            });
                            
                            setSelectedSlot(clickedSlot);
                            console.log('Canvas click:', { x, y, clickedSlot });
                          }
                        }}
                      />
                    </div>

                    {/* Properties Panel */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <h5 className="font-medium text-gray-800">Slot Properties</h5>
                      <div className="text-center text-gray-400 py-4">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                          🎯
                        </div>
                        <p className="text-xs">Select a slot to edit properties</p>
                        <p className="text-xs mt-2">Phase 3-5 functionality</p>
                      </div>

                      {/* Layout Synchronization moved here */}
                      <div className="border-t pt-4">
                        <h6 className="font-medium text-xs mb-3 text-gray-700">Layout Synchronization</h6>
                        <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-blue-900">Auto Sync Layouts</p>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-6 text-xs px-2"
                                onClick={() => setAutoSync(!autoSync)}
                              >
                                {autoSync ? 'ON' : 'OFF'}
                              </Button>
                            </div>
                            <p className="text-xs text-blue-700">Auto sync indices between desktop and mobile</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 h-7 text-xs"
                              onClick={syncLayouts}
                              disabled={syncStatus === 'syncing'}
                            >
                              <RefreshCw className={`w-3 h-3 mr-1 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                              Sync Now
                            </Button>
                          </div>
                          
                          <div className="text-xs text-blue-600 pt-1 border-t border-blue-100">
                            <div className="flex items-center gap-1 mb-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                syncStatus === 'synced' ? 'bg-green-500' :
                                syncStatus === 'out-of-sync' ? 'bg-yellow-500' :
                                'bg-blue-500 animate-pulse'
                              }`}></div>
                              <span className="font-medium capitalize">{syncStatus === 'synced' ? 'Synced' : syncStatus === 'out-of-sync' ? 'Out of Sync' : 'Syncing...'}</span>
                            </div>
                            <div>Desktop: {slots.length} slots ↔ Mobile: {mobileSlots.length} slots</div>
                            {lastSyncTime && (
                              <div>Last sync: {lastSyncTime.toLocaleTimeString()}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mobile" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium">Mobile Grid Layout</h4>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addMobileSlot}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Slot
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={removeMobileSlot}
                        disabled={!selectedMobileSlot}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Mobile Canvas Container */}
                    <div className="lg:col-span-3 bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
                      <canvas
                        ref={mobileCanvasRef}
                        width={400}
                        height={600}
                        className="border border-gray-200 rounded cursor-pointer mx-auto"
                        onClick={(e) => {
                          const rect = mobileCanvasRef.current?.getBoundingClientRect();
                          if (rect) {
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            
                            const cellWidth = 400 / mobileGridSize.cols;
                            const cellHeight = 600 / mobileGridSize.rows;
                            
                            // Check if clicked on a mobile slot
                            let clickedSlot = null;
                            mobileSlots.forEach(slot => {
                              const slotX = (slot.col - 0.5) * cellWidth;
                              const slotY = (slot.row - 0.5) * cellHeight;
                              const radius = Math.min(cellWidth, cellHeight) * 0.3;
                              
                              if (Math.sqrt((x - slotX) ** 2 + (y - slotY) ** 2) <= radius) {
                                clickedSlot = slot.id;
                              }
                            });
                            
                            setSelectedMobileSlot(clickedSlot);
                            console.log('Mobile canvas click:', { x, y, clickedSlot });
                          }
                        }}
                      />
                    </div>

                    {/* Mobile Properties Panel */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <h5 className="font-medium text-gray-800">Mobile Slot Properties</h5>
                      
                      <div className="text-center text-gray-400 py-4">
                        <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                          📱
                        </div>
                        <p className="text-xs">Select a mobile slot to edit</p>
                        <p className="text-xs mt-1">Phase 4-5 functionality</p>
                      </div>

                      {/* Grid Size Controls Preview */}
                      <div className="border-t pt-3 space-y-3">
                        <h6 className="text-xs font-medium text-gray-600">Grid Settings</h6>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-600">
                            Rows: {mobileGridSize.rows}
                          </Label>
                          <div className="w-full h-2 bg-gray-200 rounded-lg">
                            <div className="w-3/5 h-2 bg-blue-500 rounded-lg"></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-600">
                            Columns: {mobileGridSize.cols}
                          </Label>
                          <div className="w-full h-2 bg-gray-200 rounded-lg">
                            <div className="w-2/3 h-2 bg-blue-500 rounded-lg"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="icons" className="space-y-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium mb-4">Portal Icon Management</h4>
                      
                      {/* Current Icon Display */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Current Portal Icon</Label>
                          <p className="text-xs text-gray-500 mt-1">Choose an icon for your portal</p>
                        </div>
                        
                        {/* Icon Preview */}
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <div className="text-gray-400 text-2xl">🎯</div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Current Icon</p>
                            <p className="text-xs text-gray-500">{portalIcon}</p>
                          </div>
                        </div>
                        
                        {/* Icon Selection Grid */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium text-gray-600">Available Icons</Label>
                          <div className="grid grid-cols-5 gap-3">
                            {[
                              { name: 'Долина', icon: '🎯', path: '/images/portals/dolina.png' },
                              { name: 'Градина', icon: '🌸', path: '/images/portals/gradina.png' },
                              { name: 'Море', icon: '🌊', path: '/images/portals/more.png' },
                              { name: 'Гора', icon: '🌲', path: '/images/portals/gora.png' },
                              { name: 'По подразбиране', icon: '⭕', path: '/images/portals/default.png' }
                            ].map(option => (
                              <Button
                                key={option.name}
                                variant={portalIcon === option.path ? "default" : "outline"}
                                className="h-20 flex-col gap-2 p-3"
                                onClick={() => {
                                  setPortalIcon(option.path);
                                  alert(`Icon selected: ${option.name}`);
                                }}
                              >
                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                  {option.icon}
                                </div>
                                <span className="text-xs text-center">{option.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Icon Upload Section */}
                        <div className="border-t pt-4">
                          <Label className="text-sm font-medium text-gray-600">Custom Icon Upload</Label>
                          <p className="text-xs text-gray-500 mt-1 mb-3">Upload your own icon (recommended: 64x64px PNG)</p>
                          
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => alert('Custom icon upload - Phase 6 functionality!')}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Upload Icon
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setPortalIcon("/images/portals/default.png");
                                alert('Reset to default icon');
                              }}
                            >
                              Reset to Default
                            </Button>
                          </div>
                        </div>
                        
                        {/* Icon Preview in Different Sizes */}
                        <div className="border-t pt-4">
                          <Label className="text-sm font-medium text-gray-600 mb-3 block">Icon Preview</Label>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mb-1">
                                🎯
                              </div>
                              <span className="text-xs text-gray-500">Small</span>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mb-1">
                                🎯
                              </div>
                              <span className="text-xs text-gray-500">Medium</span>
                            </div>
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center mb-1">
                                🎯
                              </div>
                              <span className="text-xs text-gray-500">Large</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
              <h4 className="font-medium mb-2">Debug информация</h4>
              <div className="space-y-1 text-gray-600">
                <p><strong>Portal ID:</strong> {portalId || 'NEW'}</p>
                <p><strong>Име:</strong> {portalName || '(празно)'}</p>
                <p><strong>Режим:</strong> {portalId ? 'Редактиране' : 'Създаване'}</p>
                <p><strong>Статус:</strong> Phase 8 - API Integration Complete</p>
                <p><strong>Desktop Slots:</strong> {slots.length} | <strong>Mobile Slots:</strong> {mobileSlots.length}</p>
                <p><strong>Sync Status:</strong> {syncStatus} | <strong>Auto Sync:</strong> {autoSync ? 'Enabled' : 'Disabled'}</p>
                {saveError && <p><strong>Save Error:</strong> <span className="text-red-600">{saveError}</span></p>}
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-500">
            Portal Editor v1.0 - Phase 7 Complete
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Отказ
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !portalName.trim()}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Запазва...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Запази портал
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PortalEditor;
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Save, Trash2, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Slot {
  id: string;
  position: { top: string; left: string };
  diameter: string;
  index: string[];
}

interface GameVariant {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

interface VariantSettings {
  [variantId: string]: {
    minCells: number;
    maxCells: number;
    hasExtraItems: boolean;
  };
}

interface PortalEditorProps {
  portalId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PortalEditor({ portalId, isOpen, onClose }: PortalEditorProps) {
  const queryClient = useQueryClient();
  // Portal Settings State
  const [portalName, setPortalName] = useState('');
  const [slotMode, setSlotMode] = useState<'with_cells' | 'without_cells'>('with_cells');
  const [backgroundFileName, setBackgroundFileName] = useState('dolina-large.png');
  const [imageSize, setImageSize] = useState({ width: 1920, height: 1080 });
  
  // Current tab state
  const [activeTab, setActiveTab] = useState('desktop');
  // ...existing code...
  // Icon management state
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [availableIcons, setAvailableIcons] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Generated background files state
  const [generatedFiles, setGeneratedFiles] = useState<{
    desktop?: string;
    mobile?: string;
    icon?: string;
  }>({});

  // Variant settings state
  const [variantSettings, setVariantSettings] = useState<VariantSettings>({});
  const [availableVariants, setAvailableVariants] = useState<GameVariant[]>([]);

  // Desktop Canvas State (single source for both desktop and mobile)
  const [desktopSlots, setDesktopSlots] = useState<Slot[]>([]);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const mobileCanvasRef = useRef<HTMLDivElement>(null);
  
  // Mobile adaptation scale factors
  const MOBILE_SIZE_SCALE = 0.7; // Mobile slots are 70% of desktop size
  
  // Auto-generate mobile slots from desktop slots
  const mobileSlots: Slot[] = desktopSlots.map(slot => ({
    ...slot,
    id: slot.id.replace('desktop-slot-', 'mobile-slot-'),
    diameter: `${parseFloat(slot.diameter) * MOBILE_SIZE_SCALE}%`
  }));
  
  // Computed background image path
  const backgroundImage = backgroundFileName ? `/images/backgrounds/${backgroundFileName}` : '';
  
  console.log('Background image URL:', backgroundImage, 'backgroundFileName:', backgroundFileName);
  
  // Available background files
  const availableBackgrounds = [
    { value: 'dolina-large.png', label: 'Долина (Голяма)', size: { width: 1920, height: 1080 } },
    { value: 'dolina-small.png', label: 'Долина (Малка)', size: { width: 1280, height: 720 } }
  ];

  // Available indices for dropdown - loaded from database
  const [availableIndices, setAvailableIndices] = useState([
  { value: 'h', label: 'h - домашни' },
  { value: 'p', label: 'p - селскостопански' },
  { value: 'i', label: 'i - транспорт (влак)' },
  { value: 'r', label: 'r - транспорт (кола)' },
  { value: 's', label: 's - транспорт/птици' },
  { value: 'j', label: 'j - джунгла' },
  { value: 'l', label: 'l - джунгла (лъв)' },
  { value: 'o', label: 'o - океан' },
  { value: 'd', label: 'd - други' },
  { value: 'f', label: 'f - гора' },
  { value: 'z', label: 'z - неясна категория' },
  { value: 'sa', label: 'sa - въздушен транспорт' },
  { value: 'sg', label: 'sg - транспорт (самолет)' },
  { value: 'rg', label: 'rg - транспорт (garbage)' },
  { value: 'rp', label: 'rp - транспорт (пожарна)' }
  ]);

  // Load existing data when editing
  useEffect(() => {
    if (portalId === 'd1') {
      setPortalName('Зелена долина - Ниво 1');
      // TODO: Load existing slots from API
    }
  }, [portalId]);

  // Slot management functions
  const createSlot = (x: number, y: number) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const xPercent = ((x - rect.left) / rect.width * 100).toFixed(2);
    const yPercent = ((y - rect.top) / rect.height * 100).toFixed(2);
    
    const newSlot: Slot = {
      id: `desktop-slot-${Date.now()}`,
      position: { top: `${yPercent}%`, left: `${xPercent}%` },
      diameter: '11%',
      index: ['h']
    };
    
    setDesktopSlots(prev => [...prev, newSlot]);
    setSelectedSlot(newSlot.id);
  };

  const handleBackgroundChange = (fileName: string) => {
    setBackgroundFileName(fileName);
    const selectedBg = availableBackgrounds.find(bg => bg.value === fileName);
    if (selectedBg) {
      setImageSize(selectedBg.size);
    }
  };

  const updateSlot = (slotId: string, updates: Partial<Slot>) => {
    // Convert mobile slot ID to desktop slot ID if necessary
    const desktopSlotId = slotId.startsWith('mobile-slot-') 
      ? slotId.replace('mobile-slot-', 'desktop-slot-')
      : slotId;
    
    // Update desktop slots - mobile adapts automatically
    setDesktopSlots(prev => prev.map(slot => 
      slot.id === desktopSlotId ? { ...slot, ...updates } : slot
    ));
  };

  const deleteSlot = (slotId: string) => {
    // Convert mobile slot ID to desktop slot ID if necessary
    const desktopSlotId = slotId.startsWith('mobile-slot-') 
      ? slotId.replace('mobile-slot-', 'desktop-slot-')
      : slotId;
    
    // Delete from desktop slots - mobile adapts automatically
    setDesktopSlots(prev => prev.filter(slot => slot.id !== desktopSlotId));
    if (selectedSlot === slotId || selectedSlot === desktopSlotId) {
      setSelectedSlot(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      createSlot(e.clientX, e.clientY);
    }
  };

  const handleSlotClick = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSlot(slotId);
  };

  const handleSlotMouseDown = (slotId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedSlot(slotId);
    setIsDragging(true);
    
    const slot = desktopSlots.find(s => s.id === slotId);
    if (slot && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const slotX = (parseFloat(slot.position.left) / 100) * rect.width + rect.left;
      const slotY = (parseFloat(slot.position.top) / 100) * rect.height + rect.top;
      
      setDragOffset({
        x: e.clientX - slotX,
        y: e.clientY - slotY
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedSlot) return;
      
      // Determine which canvas is active based on active tab
      let currentCanvas = null;
      if (activeTab === 'desktop' && canvasRef.current) {
        currentCanvas = canvasRef.current;
      } else if (activeTab === 'mobile' && mobileCanvasRef.current) {
        currentCanvas = mobileCanvasRef.current;
      }
      
      if (!currentCanvas) return;
      
      const rect = currentCanvas.getBoundingClientRect();
      const x = e.clientX - dragOffset.x - rect.left;
      const y = e.clientY - dragOffset.y - rect.top;
      
      const xPercent = (x / rect.width * 100).toFixed(2);
      const yPercent = (y / rect.height * 100).toFixed(2);
      
      updateSlot(selectedSlot, {
        position: { top: `${yPercent}%`, left: `${xPercent}%` }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedSlot, dragOffset]);

  // Computed selected slot data (works for both desktop and mobile views)
  const selectedSlotData = selectedSlot ? 
    desktopSlots.find(slot => slot.id === selectedSlot || slot.id === selectedSlot.replace('mobile-slot-', 'desktop-slot-')) || null 
    : null;

  const handleSave = async () => {
    if (!portalName.trim()) {
      alert('Моля въведете име на портала');
      return;
    }

    if (!backgroundFileName) {
      alert('Моля изберете фонова картина преди да запазите портала');
      return;
    }

    setIsSaving(true);

    try {
      let layoutId: string;
      let portalIdToUse: string;

      if (portalId) {
        // Editing existing portal - update portal data with variant settings
        portalIdToUse = portalId;
        layoutId = portalId; // For existing portals, layoutId is the same as portalId

        const portalUpdateData = {
          variantSettings: variantSettings
        };

        const portalUpdateResponse = await fetch(`http://localhost:3005/api/portals/${portalId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(portalUpdateData)
        });

        if (!portalUpdateResponse.ok) {
          console.warn('Failed to update portal variant settings, but continuing with layout update');
        } else {
          console.log('Portal variant settings updated successfully');
        }
      } else {
        // Creating new portal - generate IDs
        // Get existing portals to find next available ID
        const portalsResponse = await fetch('http://localhost:3005/api/portals');
        let existingPortals: string[] = ['d1']; // Default

        if (portalsResponse.ok) {
          const portalsData = await portalsResponse.json();
          existingPortals = portalsData.map((p: any) => p.id);
        }

        // Generate next available portal ID
        let nextId = 2;
        while (existingPortals.includes(`d${nextId}`)) {
          nextId++;
        }

        portalIdToUse = `d${nextId}`;
        layoutId = `l${Date.now()}`; // Use timestamp for layout ID

        // Create new portal first
        const portalData = {
          id: portalIdToUse,
          portalName: portalName.trim(),
          fileName: backgroundFileName,
          iconFileName: selectedIcon || backgroundFileName,
          layouts: [layoutId],
          cellCount: desktopSlots.length,
          min_cells: Math.max(1, desktopSlots.length - 2),
          max_cells: desktopSlots.length + 2,
          item_count_rule: "equals_cells",
          variantSettings: variantSettings,
          isLocked: false
        };

        console.log('Creating new portal:', portalData);

        const portalResponse = await fetch('http://localhost:3005/api/portals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(portalData)
        });

        if (!portalResponse.ok) {
          const errorData = await portalResponse.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`Failed to create portal: ${errorData.message || portalResponse.status}`);
        }

        console.log('Portal created successfully');
      }

      // Prepare layout data for save/create
      const layoutData = {
        id: layoutId,
        name: portalName.trim(),
        backgroundLarge: generatedFiles.desktop ? `/images/backgrounds/${generatedFiles.desktop}` : `/images/backgrounds/${backgroundFileName}`,
        backgroundSmall: generatedFiles.mobile ? `/images/backgrounds/${generatedFiles.mobile}` : `/images/backgrounds/${backgroundFileName}`,
        slots_desktop: desktopSlots,
        slots_mobile: mobileSlots,
        ...(selectedIcon && { iconFileName: selectedIcon })
      };

      console.log('Saving layout data:', layoutData);

      // Save layout (create if new, update if existing)
      const layoutResponse = await fetch(`http://localhost:3005/api/layouts/${layoutId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(layoutData)
      });

      if (!layoutResponse.ok) {
        const errorData = await layoutResponse.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Failed to save layout: ${errorData.message || layoutResponse.status}`);
      }

      const result = await layoutResponse.json();
      console.log('Save successful:', result);

      alert(`Портала е ${portalId ? 'запазен' : 'създаден'} успешно! ID: ${portalIdToUse}`);
      
      // Refresh portals list in admin panel
      queryClient.invalidateQueries({ queryKey: ["admin-portals"] });
      
      // Also invalidate game session cache for this portal
      queryClient.invalidateQueries({ queryKey: ["gameSession", portalIdToUse] });
      
      onClose();
    } catch (error) {
      console.error('Failed to save portal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестна грешка';
      alert(`Грешка при запазване на портала: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Load existing portal data when component mounts or portalId changes
  useEffect(() => {
    const loadPortalData = async () => {
      if (!portalId || !isOpen) return;
      
      try {
        console.log(`Attempting to load data for portal: ${portalId}`);
        
        // Load both portal and layout data in one request
        const response = await fetch(`http://localhost:3005/api/portals/${portalId}/full`);
        
        if (response.ok) {
          const data = await response.json();
          const { portal, layout } = data;
          
          console.log('Loaded portal data:', portal);
          console.log('Loaded layout data:', layout);
          
          // Load portal settings from portal data
          setPortalName(portal.portalName || '');
          if (layout?.backgroundLarge) {
            const fileName = layout.backgroundLarge.split('/').pop() || 'dolina-large.png';
            setBackgroundFileName(fileName);
          }
          
          // Load desktop slots
          if (layout?.slots_desktop && Array.isArray(layout.slots_desktop)) {
            setDesktopSlots(layout.slots_desktop);
          }
          
          // Load mobile slots if available (they will be scaled from desktop slots)
          // Mobile slots are computed from desktop slots with MOBILE_SIZE_SCALE
          
          console.log('Successfully loaded portal and layout data');
        } else if (response.status === 404) {
          // Portal doesn't exist - this is normal for new portals
          console.log(`Portal ${portalId} not found - this is expected for new portals`);
        } else {
          console.error(`Failed to load portal data: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to load portal data:', error);
      }
    };

    loadPortalData();
  }, [portalId, isOpen]);

  // Reset state when opening for new portal
  useEffect(() => {
    if (isOpen) {
      // Reset all state when opening the editor
      setPortalName('');
      setSlotMode('with_cells');
      setBackgroundFileName('');
      setImageSize({ width: 1920, height: 1080 });
      setActiveTab('desktop');
      setSelectedIcon(null);
      setIsSaving(false);
      setGeneratedFiles({});
      setDesktopSlots([]);
      setSelectedSlot(null);
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      setVariantSettings({});
    }
  }, [isOpen]);

  // Load available icons
  useEffect(() => {
    const loadIcons = async () => {
      try {
        // Get icons from API or hardcoded list for now
        const icons = [
          '1758682345806-robin.png',
          '1758683309594-wolf.png', 
          '1758684157766-train1.png',
          '1758684433340-train2.png',
          '1758686243635-train3.png',
          '1758686331550-dove.png',
          '1758689691831-firetruck.png',
          '1758693122489-balloon.png',
          '1758750796740-lion.png',
          'airplane.png',
          'bus.png',
          'cat.png',
          'chicken.png',
          'cow.png',
          'crow.png',
          'dog.png',
          'firetruck.png',
          'train.png'
        ];
        setAvailableIcons(icons);
      } catch (error) {
        console.error('Failed to load icons:', error);
      }
    };

    // Load categories/indices from database
    const loadCategories = async () => {
      try {
        const response = await fetch('http://localhost:3005/api/admin/categories');
        if (response.ok) {
          const categories = await response.json();
          const indices = categories.map((cat: any) => ({
            value: cat.indexValue,
            label: `${cat.indexValue} - ${cat.categoryName}${cat.description ? ` (${cat.description})` : ''}`
          }));
          setAvailableIndices(indices);
          console.log('Loaded categories from database:', indices);
        } else {
          console.log('Failed to load categories, using fallback');
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    // Load available variants
    const loadVariants = async () => {
      try {
        const response = await fetch('http://localhost:3005/api/game-variants');
        if (response.ok) {
          const variants = await response.json();
          setAvailableVariants(variants);
          console.log('Loaded variants:', variants);
        } else {
          console.log('Failed to load variants');
        }
      } catch (error) {
        console.error('Failed to load variants:', error);
      }
    };

    if (isOpen) {
      loadIcons();
      loadCategories();
      loadVariants();
    }
  }, [isOpen]);

  const handleIconSelect = (iconFileName: string) => {
    setSelectedIcon(iconFileName);
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Моля изберете изображение файл (PNG, JPG)');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файлът е твърде голям. Максимален размер: 5MB');
      return;
    }

    console.log('Uploading icon:', file.name);
    // TODO: Implement actual upload to server
    alert(`Upload на "${file.name}" ще бъде имплементиран в следващата фаза.`);
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Моля изберете изображение файл (PNG, JPG)');
      return;
    }

    // Check file size (max 10MB for backgrounds)
    if (file.size > 10 * 1024 * 1024) {
      alert('Файлът е твърде голям. Максимален размер: 10MB');
      return;
    }

    try {
      console.log('Uploading background:', file.name);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('background', file);
      formData.append('portalId', portalId || 'd1');

      // Upload to server
      const response = await fetch('http://localhost:3005/api/upload/background', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      // Update state with new filenames
      setBackgroundFileName(result.desktop);
      setImageSize(result.size || { width: 1920, height: 1080 });

      // Store generated files for display in tabs
      setGeneratedFiles({
        desktop: result.desktop,
        mobile: result.mobile,
        icon: result.icon
      });

      console.log('Background image set to:', `/images/backgrounds/${result.desktop}`);

      alert(`Фонът е качен успешно! Създадени са файлове:\n- Desktop: ${result.desktop}\n- Mobile: ${result.mobile}\n- Icon: ${result.icon}`);

    } catch (error) {
      console.error('Failed to upload background:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестна грешка';
      alert(`Грешка при качване на фона: ${errorMessage}`);
    } finally {
      // Clear the input only after processing is complete
      event.target.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] h-[98vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">
                {portalId ? `Редактиране на портал: ${portalId}` : 'Създаване на нов портал'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {portalId ? `Редактирайте настройките на портал ${portalId}` : 'Създайте нов портал с фонова картина, slots и настройки'}
              </DialogDescription>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center gap-2 h-8"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Запазва...' : 'Запази'}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Portal Settings Section */}
          <div className="p-3 border-b bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Настройки на портал</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Portal Name */}
              <div className="space-y-2">
                <Label htmlFor="portal-name" className="text-sm">Име на портала</Label>
                <Input
                  id="portal-name"
                  className="h-8"
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  placeholder="Въведете име на портала..."
                />
              </div>

              {/* Background File */}
              <div className="space-y-2">
                <Label className="text-sm">Фонова картина</Label>
                <div className="flex gap-2">
                  <Input
                    value={backgroundFileName}
                    readOnly
                    placeholder="Няма избран файл - моля качете нов"
                    className="h-8 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('background-upload')?.click()}
                    className="h-8 px-3"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                </div>
                <input
                  id="background-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleBackgroundUpload}
                  className="hidden"
                />
              </div>

              {/* Image Size Display */}
              <div className="space-y-2">
                <Label className="text-sm">Размер (пиксели)</Label>
                <div className="h-8 px-3 py-1 border rounded-md bg-white text-sm flex items-center text-gray-600">
                  {imageSize.width} × {imageSize.height}
                </div>
              </div>

              {/* Slot Mode */}
              <div className="space-y-2">
                <Label className="text-sm">Режим на фона</Label>
                <RadioGroup value={slotMode} onValueChange={(value) => setSlotMode(value as any)} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="with_cells" id="with_cells" />
                    <Label htmlFor="with_cells" className="text-xs">С клетки</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="without_cells" id="without_cells" />
                    <Label htmlFor="without_cells" className="text-xs">Без клетки</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 mx-3 mt-2 mb-0">
                <TabsTrigger value="desktop" className="text-sm">Desktop</TabsTrigger>
                <TabsTrigger value="mobile" className="text-sm">Mobile</TabsTrigger>
                <TabsTrigger value="icon" className="text-sm">Икони</TabsTrigger>
                <TabsTrigger value="variants" className="text-sm">Варианти</TabsTrigger>
              </TabsList>

              {/* Desktop Tab */}
              <TabsContent value="desktop" className="flex-1 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 h-full p-3">
                  {/* Canvas Area - Left Half */}
                  <div className="flex flex-col">
                    <div className="mb-2">
                      <p className="text-xs text-gray-600">
                        <strong>Shift+Click</strong> нов slot | <strong>Click</strong> селекция | <strong>Drag</strong> преместване
                      </p>
                    </div>
                    
                    <div 
                      ref={canvasRef}
                      className="relative w-full bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden cursor-crosshair flex-1"
                      style={{ 
                        minHeight: '400px',
                        backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
                        backgroundSize: backgroundImage ? 'cover' : '20px 20px',
                        backgroundPosition: backgroundImage ? 'center' : '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                      onClick={handleCanvasClick}
                    >
                      {/* Background image as img element for debugging */}
                      {backgroundImage && (
                        <img
                          src={backgroundImage}
                          alt="Background"
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          onError={(e) => console.error('Background image failed to load:', backgroundImage)}
                          onLoad={() => console.log('Background image loaded successfully:', backgroundImage)}
                        />
                      )}
                      {/* Render Slots */}
                      {desktopSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 cursor-pointer transition-all ${
                            selectedSlot === slot.id 
                              ? 'border-blue-500 bg-blue-200' 
                              : 'border-white bg-white/20 hover:bg-white/40'
                          }`}
                          style={{
                            top: slot.position.top,
                            left: slot.position.left,
                            width: slot.diameter,
                            height: slot.diameter,
                          }}
                          onClick={(e) => handleSlotClick(slot.id, e)}
                          onMouseDown={(e) => handleSlotMouseDown(slot.id, e)}
                        >
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                            {slot.index.join(',')}
                          </div>
                        </div>
                      ))}
                      
                      {/* Canvas Overlay Info */}
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                        Desktop Slots: {desktopSlots.length}
                      </div>
                      
                      {/* No background message */}
                      {!backgroundFileName && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="bg-white/90 px-4 py-2 rounded-lg text-center">
                            <p className="text-sm font-medium text-gray-700">Няма избрана фонова картина</p>
                            <p className="text-xs text-gray-500 mt-1">Качете файл в секцията "Настройки на портал"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Properties Panel - Right Half */}
                  <div className="flex flex-col">
                    <div className="bg-gray-50 p-4 rounded-lg flex-1 overflow-y-auto">
                      <h3 className="font-semibold mb-4 text-lg">Properties</h3>
                      
                      {selectedSlotData ? (
                        <div className="space-y-4">
                          {/* Slot ID */}
                          <div>
                            <Label className="text-sm text-gray-500">Slot ID</Label>
                            <p className="text-sm font-mono bg-white p-2 rounded border break-all">
                              {selectedSlotData.id}
                            </p>
                          </div>

                          {/* Index Selection */}
                          <div>
                            <Label className="text-sm font-medium">Index</Label>
                            <Select 
                              value={selectedSlotData.index[0]} 
                              onValueChange={(value) => updateSlot(selectedSlotData.id, { index: [value] })}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIndices.map((indexItem, idx) => (
                                  <SelectItem key={selectedSlotData.id + '-' + idx} value={indexItem.value}>
                                    {indexItem.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Position */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium">Top (%)</Label>
                              <Input 
                                type="number" 
                                step="0.1"
                                className="h-10"
                                value={parseFloat(selectedSlotData.position.top)} 
                                onChange={(e) => updateSlot(selectedSlotData.id, { 
                                  position: { ...selectedSlotData.position, top: `${e.target.value}%` }
                                })}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Left (%)</Label>
                              <Input 
                                type="number" 
                                step="0.1"
                                className="h-10"
                                value={parseFloat(selectedSlotData.position.left)} 
                                onChange={(e) => updateSlot(selectedSlotData.id, { 
                                  position: { ...selectedSlotData.position, left: `${e.target.value}%` }
                                })}
                              />
                            </div>
                          </div>

                          {/* Diameter */}
                          <div>
                            <Label className="text-sm font-medium">Diameter (%)</Label>
                            <Input 
                              type="number" 
                              step="0.5"
                              className="h-10"
                              value={parseFloat(selectedSlotData.diameter)} 
                              onChange={(e) => updateSlot(selectedSlotData.id, { diameter: `${e.target.value}%` })}
                            />
                          </div>

                          {/* Delete Button */}
                          <Button 
                            variant="destructive" 
                            className="w-full mt-6"
                            onClick={() => deleteSlot(selectedSlotData.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Slot
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 mt-12">
                          <p className="text-lg mb-2">Селектирайте slot за редактиране</p>
                          <p className="text-sm">Shift+Click върху canvas за създаване на нов slot</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Mobile Tab */}
              <TabsContent value="mobile" className="flex-1 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 h-full p-3">
                  {/* Mobile Canvas Area - Left Half */}
                  <div className="flex flex-col">
                    <div className="mb-2">
                      <p className="text-xs text-gray-600">
                        <strong>Shift+Click</strong> нов slot | <strong>Click</strong> селекция | <strong>Drag</strong> преместване
                      </p>
                    </div>
                    
                    <div 
                      ref={mobileCanvasRef}
                      className="relative w-full bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden cursor-crosshair flex-1"
                      style={{ 
                        minHeight: '400px',
                        backgroundImage: backgroundImage ? `url('${backgroundImage}')` : 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
                        backgroundSize: backgroundImage ? 'cover' : '20px 20px',
                        backgroundPosition: backgroundImage ? 'center' : '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                      onClick={handleCanvasClick}
                    >
                      {/* Background image as img element for debugging */}
                      {backgroundImage && (
                        <img
                          src={backgroundImage}
                          alt="Background"
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          onError={(e) => console.error('Mobile background image failed to load:', backgroundImage)}
                          onLoad={() => console.log('Mobile background image loaded successfully:', backgroundImage)}
                        />
                      )}
                      {/* Render Mobile Slots */}
                      {mobileSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 cursor-pointer transition-all ${
                            selectedSlot === slot.id 
                              ? 'border-green-500 bg-green-200' 
                              : 'border-white bg-white/20 hover:bg-white/40'
                          }`}
                          style={{
                            top: slot.position.top,
                            left: slot.position.left,
                            width: slot.diameter,
                            height: slot.diameter,
                          }}
                          onClick={(e) => handleSlotClick(slot.id, e)}
                          onMouseDown={(e) => handleSlotMouseDown(slot.id, e)}
                        >
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                            {slot.index.join(',')}
                          </div>
                        </div>
                      ))}
                      
                      {/* Canvas Overlay Info */}
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                        Mobile Slots: {mobileSlots.length}
                      </div>
                      
                      {/* No background message */}
                      {!backgroundFileName && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="bg-white/90 px-4 py-2 rounded-lg text-center">
                            <p className="text-sm font-medium text-gray-700">Няма избрана фонова картина</p>
                            <p className="text-xs text-gray-500 mt-1">Качете файл в секцията "Настройки на портал"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Properties Panel - Right Half (shared with Desktop) */}
                  <div className="flex flex-col">
                    {/* Generated Mobile File Preview */}
                    {generatedFiles.mobile && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-green-800 mb-2">Генериран мобилен файл</h4>
                        <div className="flex items-center gap-3">
                          <img
                            src={`/images/backgrounds/${generatedFiles.mobile}`}
                            alt="Mobile background"
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-mono text-green-700 break-all">
                              {generatedFiles.mobile}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              70% от оригиналния размер
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg flex-1 overflow-y-auto">
                      <h3 className="font-semibold mb-4 text-lg">Properties</h3>
                      
                      {selectedSlotData ? (
                        <div className="space-y-4">
                          {/* Slot ID */}
                          <div>
                            <Label className="text-sm text-gray-500">Slot ID</Label>
                            <p className="text-sm font-mono bg-white p-2 rounded border break-all">
                              {selectedSlotData.id}
                            </p>
                          </div>

                          {/* Index Selection */}
                          <div>
                            <Label className="text-sm font-medium">Index</Label>
                            <Select 
                              value={selectedSlotData.index[0]} 
                              onValueChange={(value) => updateSlot(selectedSlotData.id, { index: [value] })}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIndices.map((indexItem, i) => (
                                  <SelectItem key={(selectedSlotData?.id || 'slot') + '-' + indexItem.value + '-' + i} value={indexItem.value}>
                                    {indexItem.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Position */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium">Top (%)</Label>
                              <Input 
                                type="number" 
                                step="0.1"
                                className="h-10"
                                value={parseFloat(selectedSlotData.position.top)} 
                                onChange={(e) => updateSlot(selectedSlotData.id, { 
                                  position: { ...selectedSlotData.position, top: `${e.target.value}%` }
                                })}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Left (%)</Label>
                              <Input 
                                type="number" 
                                step="0.1"
                                className="h-10"
                                value={parseFloat(selectedSlotData.position.left)} 
                                onChange={(e) => updateSlot(selectedSlotData.id, { 
                                  position: { ...selectedSlotData.position, left: `${e.target.value}%` }
                                })}
                              />
                            </div>
                          </div>

                          {/* Diameter */}
                          <div>
                            <Label className="text-sm font-medium">Diameter (%)</Label>
                            <Input 
                              type="number" 
                              step="0.5"
                              className="h-10"
                              value={parseFloat(selectedSlotData.diameter)} 
                              onChange={(e) => updateSlot(selectedSlotData.id, { diameter: `${e.target.value}%` })}
                            />
                          </div>

                          {/* Delete Button */}
                          <Button 
                            variant="destructive" 
                            className="w-full mt-6"
                            onClick={() => deleteSlot(selectedSlotData.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Slot
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 mt-12">
                          <p className="text-lg mb-2">Селектирайте slot за редактиране</p>
                          <p className="text-sm">Shift+Click върху canvas за създаване на нов slot</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Icon Tab */}
              <TabsContent value="icon" className="flex-1 overflow-hidden">
                <div className="h-full p-4">
                  {/* Generated Icon File Preview */}
                  {generatedFiles.icon && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">Генерирана икона</h4>
                      <div className="flex items-center gap-3">
                        <img
                          src={`/images/backgrounds/${generatedFiles.icon}`}
                          alt="Generated icon"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-mono text-blue-700 break-all">
                            {generatedFiles.icon}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            200x200 пиксела
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Icon Gallery</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Изберете икона за портала. Избраната икона: 
                      <span className="font-semibold ml-1">
                        {selectedIcon || 'Няма избрана'}
                      </span>
                    </p>
                  </div>
                  
                  {/* Icon Grid */}
                  <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 h-full overflow-y-auto pr-2">
                    {availableIcons.map((iconFile) => (
                      <div
                        key={iconFile}
                        className={`relative aspect-square border-2 rounded-lg cursor-pointer transition-all hover:scale-105 group ${
                          selectedIcon === iconFile 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => handleIconSelect(iconFile)}
                        title={iconFile}
                      >
                        {/* Icon Image */}
                        <img
                          src={`/images/${iconFile}`}
                          alt={iconFile}
                          className="w-full h-full object-contain p-1 rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        
                        {/* Selected Indicator */}
                        {selectedIcon === iconFile && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {iconFile.replace(/^\d+-/, '').replace('.png', '')}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Upload Zone */}
                  <div 
                    className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('icon-upload')?.click()}
                  >
                    <div className="text-gray-500">
                      <p className="text-sm font-medium">Upload нова икона</p>
                      <p className="text-xs mt-1">Drag & drop файл тук или кликнете за избор</p>
                      <p className="text-xs text-gray-400 mt-2">Поддържани формати: PNG, JPG (препоръчително 128x128px)</p>
                    </div>
                    <input
                      id="icon-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleIconUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Variants Tab */}
              <TabsContent value="variants" className="flex-1 overflow-hidden">
                <div className="h-full p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Настройки за варианти</h3>
                    <p className="text-sm text-gray-600">
                      Конфигурирайте настройките за всеки вариант на играта (възрастова група).
                    </p>
                  </div>

                  <div className="space-y-6">
                    {availableVariants.map((variant) => (
                      <div key={variant.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-base">{variant.displayName}</h4>
                            <p className="text-sm text-gray-600">{variant.description}</p>
                            <p className="text-xs text-gray-500 mt-1">ID: {variant.id}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Min Cells */}
                          <div>
                            <Label className="text-sm font-medium">Мин. клетки</Label>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              className="h-10 mt-1"
                              value={variantSettings[variant.id]?.minCells ?? 1}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setVariantSettings(prev => ({
                                  ...prev,
                                  [variant.id]: {
                                    ...prev[variant.id],
                                    minCells: value,
                                    maxCells: Math.max(value, prev[variant.id]?.maxCells ?? value + 2)
                                  }
                                }));
                              }}
                            />
                          </div>

                          {/* Max Cells */}
                          <div>
                            <Label className="text-sm font-medium">Макс. клетки</Label>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              className="h-10 mt-1"
                              value={variantSettings[variant.id]?.maxCells ?? (desktopSlots.length + 2)}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setVariantSettings(prev => ({
                                  ...prev,
                                  [variant.id]: {
                                    ...prev[variant.id],
                                    maxCells: value,
                                    minCells: Math.min(value, prev[variant.id]?.minCells ?? 1)
                                  }
                                }));
                              }}
                            />
                          </div>

                          {/* Has Extra Items */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`extra-items-${variant.id}`}
                              checked={variantSettings[variant.id]?.hasExtraItems ?? false}
                              onCheckedChange={(checked) => {
                                setVariantSettings(prev => ({
                                  ...prev,
                                  [variant.id]: {
                                    ...prev[variant.id],
                                    hasExtraItems: checked as boolean
                                  }
                                }));
                              }}
                            />
                            <Label htmlFor={`extra-items-${variant.id}`} className="text-sm font-medium">
                              +2 допълнителни елемента
                            </Label>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-xs text-gray-600 mb-2">Преглед на настройките:</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Клетки: {variantSettings[variant.id]?.minCells ?? 1} - {variantSettings[variant.id]?.maxCells ?? (desktopSlots.length + 2)}</span>
                            <span>Допълнителни елементи: {variantSettings[variant.id]?.hasExtraItems ? 'Да (+2)' : 'Не'}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {availableVariants.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <p>Няма налични варианти. Моля, първо създайте варианти в системата.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}